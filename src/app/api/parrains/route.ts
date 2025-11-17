import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ParrainCreateSchema } from '@/lib/validation'
import { generateEcheances, recomputeNombreParrainages, recomputeEcheancesForParrain } from '@/lib/kafala'
import { Prisma } from '@prisma/client'

// GET /api/parrains - Liste tous les parrains
export async function GET(request: NextRequest) {
  try {
    const parrains = await prisma.parrain.findMany({
      include: {
        parrainages: {
          select: {
            id: true,
          },
        },
        recus: {
          select: {
            id: true,
          },
        },
        virements: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const parrainsAvecStats = parrains.map((parrain) => ({
      id: parrain.id,
      type: parrain.type,
      nom: parrain.nom,
      prenom: parrain.prenom,
      cin: parrain.cin,
      ice: parrain.ice,
      email: parrain.email,
      tel: parrain.tel,
      adresse: parrain.adresse,
      valeurKafala: parrain.valeurKafala,
      donateurCode: parrain.donateurCode,
      parrainCode: parrain.parrainCode,
      estMembre: parrain.estMembre,
      estDonateur: parrain.estDonateur,
      estParrain: parrain.estParrain,
      nombreParrainages: parrain.parrainages.length,
      nombreRecus: parrain.recus.length,
      nombreVirements: parrain.virements.length,
      createdAt: parrain.createdAt,
      updatedAt: parrain.updatedAt,
    }))

    return NextResponse.json(parrainsAvecStats)
  } catch (error) {
    console.error('Erreur lors de la récupération des parrains:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la récupération des parrains' },
      { status: 500 }
    )
  }
}

// POST /api/parrains - Crée un nouveau parrain
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orphelinIds, closePrevious, ...parrainData } = body
    const data = ParrainCreateSchema.parse(parrainData)

    // Vérifier que valeurKafala et type sont présents
    if (!data.valeurKafala || !data.type) {
      return NextResponse.json(
        { erreur: 'La valeur Kafala et le type sont requis' },
        { status: 400 }
      )
    }

    const parrain = await prisma.$transaction(async (tx) => {
      // Convertir valeurKafala en Decimal
      const valeurKafalaDecimal = new Prisma.Decimal(data.valeurKafala)
      const maintenant = new Date()

      // Créer le parrain
      const nouveauParrain = await tx.parrain.create({
        data: {
          ...data,
          valeurKafala: valeurKafalaDecimal,
        },
      })

      // Assigner les orphelins si fournis
      if (orphelinIds && Array.isArray(orphelinIds) && orphelinIds.length > 0) {
        for (const orphelinId of orphelinIds) {
          // Vérifier s'il existe un parrainage actif
          // Un parrainage est actif si dateFin est null OU si dateFin est dans le futur
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
            await tx.parrainage.create({
              data: {
                parrainId: nouveauParrain.id,
                orphelinId,
                dateDebut: new Date(),
                dateFin: null, // Explicitement défini comme actif
                valeurKafala: valeurKafalaDecimal, // Utiliser le Decimal converti
              },
            })
          }
        }

        // Recalculer nombreParrainages après création des parrainages
        const nombreParrainages = await recomputeNombreParrainages(nouveauParrain.id, tx)

        // Générer les échéances pour tous les nouveaux parrainages actifs
        const nouveauxParrainages = await tx.parrainage.findMany({
          where: {
            parrainId: nouveauParrain.id,
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
            valeurKafalaDecimal,
            nombreParrainages,
            null,
            tx
          )
        }

        // Recalculer les échéances pour tous les parrainages actifs
        await recomputeEcheancesForParrain(nouveauParrain.id, tx)
      } else {
        // Même sans orphelins, initialiser nombreParrainages à 0
        await recomputeNombreParrainages(nouveauParrain.id, tx)
      }

      return nouveauParrain
    })

    return NextResponse.json(parrain, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { erreur: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erreur lors de la création du parrain:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la création du parrain' },
      { status: 500 }
    )
  }
}

