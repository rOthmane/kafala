import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ParrainUpdateSchema } from '@/lib/validation'
import { generateEcheances, recomputeNombreParrainages, recomputeEcheancesForParrain, isParrainageActive } from '@/lib/kafala'
import { Prisma } from '@prisma/client'

// GET /api/parrains/[id] - Récupère un parrain par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const parrain = await prisma.parrain.findUnique({
      where: { id },
      include: {
        parrainages: {
          include: {
            orphelin: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                dateNaissance: true,
              },
            },
            echeances: {
              orderBy: {
                mois: 'asc',
              },
            },
          },
          orderBy: {
            dateDebut: 'desc',
          },
        },
        recus: {
          orderBy: {
            dateEmission: 'desc',
          },
        },
        virements: {
          include: {
            veuve: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                rib: true,
              },
            },
            orphelin: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
          orderBy: {
            dateVirement: 'desc',
          },
        },
        paiements: {
          include: {
            orphelin: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
            veuve: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
            recu: {
              select: {
                id: true,
                numero: true,
              },
            },
          },
          orderBy: {
            datePaiement: 'desc',
          },
        },
      },
    })

    if (!parrain) {
      return NextResponse.json(
        { erreur: 'Parrain non trouvé' },
        { status: 404 }
      )
    }

    // Ajouter le flag active aux parrainages
    const parrainAvecActive = {
      ...parrain,
      parrainages: parrain.parrainages.map((p: any) => ({
        ...p,
        active: isParrainageActive(p.dateFin),
      })),
    }

    return NextResponse.json(parrainAvecActive)
  } catch (error) {
    console.error('Erreur lors de la récupération du parrain:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la récupération du parrain' },
      { status: 500 }
    )
  }
}

// PATCH /api/parrains/[id] - Met à jour un parrain
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { orphelinIds, closePrevious, ...parrainData } = body
    const data = ParrainUpdateSchema.parse(parrainData)

    const parrain = await prisma.$transaction(async (tx) => {
      // Récupérer le parrain existant pour comparer valeurKafala
      const parrainExistant = await tx.parrain.findUnique({
        where: { id },
        select: { valeurKafala: true },
      })

      if (!parrainExistant) {
        throw new Error('Parrain non trouvé')
      }

      // Convertir valeurKafala en Decimal si présent
      const updateData: any = { ...data }
      if (data.valeurKafala !== undefined) {
        updateData.valeurKafala = new Prisma.Decimal(data.valeurKafala)
      }

      // Mettre à jour le parrain
      const parrainMisAJour = await tx.parrain.update({
        where: { id },
        data: updateData,
      })

      const valeurKafalaChanged = data.valeurKafala !== undefined && 
        parrainExistant.valeurKafala.toNumber() !== data.valeurKafala

      // Assigner les orphelins si fournis
      if (orphelinIds && Array.isArray(orphelinIds)) {
        for (const orphelinId of orphelinIds) {
          // Vérifier s'il existe un parrainage actif
          // Un parrainage est actif si dateFin est null OU si dateFin est dans le futur
          const maintenant = new Date()
          const parrainageActif = await tx.parrainage.findFirst({
            where: {
              orphelinId,
              OR: [
                { dateFin: null },
                { dateFin: { gt: maintenant } },
              ],
            },
          })

          // Clôturer le précédent si demandé
          if (parrainageActif && closePrevious) {
            await tx.parrainage.update({
              where: { id: parrainageActif.id },
              data: { dateFin: new Date() },
            })
          }

          // Créer le nouveau parrainage seulement s'il n'y a pas de parrainage actif ou si on a fermé le précédent
          if (!parrainageActif || closePrevious) {
            // Utiliser la valeurKafala mise à jour ou celle du parrain existant (déjà en Decimal)
            const valeurKafalaPourParrainage = updateData.valeurKafala || parrainMisAJour.valeurKafala
            
            await tx.parrainage.create({
              data: {
                parrainId: id,
                orphelinId,
                dateDebut: new Date(),
                dateFin: null, // Explicitement défini comme actif
                valeurKafala: valeurKafalaPourParrainage,
              },
            })
          }
        }

        // Recalculer nombreParrainages après création des parrainages
        const nombreParrainages = await recomputeNombreParrainages(id, tx)

        // Récupérer valeurKafala pour génération des échéances
        const valeurKafalaPourEcheances = updateData.valeurKafala || parrainMisAJour.valeurKafala

        // Générer les échéances pour tous les nouveaux parrainages actifs
        const nouveauxParrainages = await tx.parrainage.findMany({
          where: {
            parrainId: id,
            dateDebut: {
              gte: new Date(new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000), // Parrainages créés aujourd'hui ou hier
            },
            OR: [
              { dateFin: null },
              { dateFin: { gt: maintenant } },
            ],
          },
        })

        for (const parrainage of nouveauxParrainages) {
          await generateEcheances(
            parrainage.id,
            parrainage.dateDebut,
            valeurKafalaPourEcheances,
            nombreParrainages,
            null,
            tx
          )
        }
      }

      // Recalculer les échéances si valeurKafala a changé ou si des parrainages ont été créés
      if (valeurKafalaChanged || (orphelinIds && Array.isArray(orphelinIds) && orphelinIds.length > 0)) {
        await recomputeNombreParrainages(id, tx)
        await recomputeEcheancesForParrain(id, tx)
      }

      return parrainMisAJour
    })

    return NextResponse.json(parrain)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { erreur: 'Parrain non trouvé' },
        { status: 404 }
      )
    }
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { erreur: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erreur lors de la mise à jour du parrain:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la mise à jour du parrain' },
      { status: 500 }
    )
  }
}

// DELETE /api/parrains/[id] - Supprime un parrain
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.parrain.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Parrain supprimé avec succès' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { erreur: 'Parrain non trouvé' },
        { status: 404 }
      )
    }
    console.error('Erreur lors de la suppression du parrain:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la suppression du parrain' },
      { status: 500 }
    )
  }
}

