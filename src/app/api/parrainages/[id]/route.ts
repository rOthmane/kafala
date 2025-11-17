import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ParrainageUpdateSchema } from '@/lib/validation'
import { generateEcheances, recomputeNombreParrainages, recomputeEcheancesForParrain, isParrainageActive } from '@/lib/kafala'

// GET /api/parrainages/[id] - Récupère un parrainage par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const parrainage = await prisma.parrainage.findUnique({
      where: { id },
      include: {
        parrain: true,
        orphelin: {
          include: {
            veuve: true,
          },
        },
        echeances: {
          orderBy: {
            mois: 'asc',
          },
        },
      },
    })

    if (!parrainage) {
      return NextResponse.json(
        { erreur: 'Parrainage non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...parrainage,
      active: isParrainageActive(parrainage.dateFin),
    })
  } catch (error) {
    console.error('Erreur lors de la récupération du parrainage:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la récupération du parrainage' },
      { status: 500 }
    )
  }
}

// PATCH /api/parrainages/[id] - Met à jour un parrainage
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = ParrainageUpdateSchema.parse(body)

    const parrainage = await prisma.$transaction(async (tx) => {
      const parrainageExistant = await tx.parrainage.findUnique({
        where: { id },
      })

      if (!parrainageExistant) {
        throw new Error('Parrainage non trouvé')
      }

      // Si les dates ou la valeur Kafala changent, régénérer les échéances
      const datesChanged =
        (data.dateDebut && data.dateDebut.getTime() !== parrainageExistant.dateDebut.getTime()) ||
        (data.dateFin !== undefined && 
          (data.dateFin?.getTime() || null) !== (parrainageExistant.dateFin?.getTime() || null))
      const valeurChanged = data.valeurKafala && data.valeurKafala !== parrainageExistant.valeurKafala

      const parrainageMisAJour = await tx.parrainage.update({
        where: { id },
        data,
      })

      if (datesChanged || valeurChanged) {
        // Supprimer les anciennes échéances non soldées
        await tx.echeance.deleteMany({
          where: {
            parrainageId: id,
            soldée: false,
          },
        })

        // Récupérer le parrain pour obtenir valeurKafala et nombreParrainages
        const parrain = await tx.parrain.findUnique({
          where: { id: parrainageExistant.parrainId },
          select: {
            valeurKafala: true,
            nombreParrainages: true,
          },
        })

        if (parrain) {
          const nombreParrainages = parrain.nombreParrainages || 1
          // Utiliser la valeurKafala du parrain (pas celle du parrainage)
          const valeurKafalaPourEcheances = parrain.valeurKafala

          // Générer de nouvelles échéances (utiliser le client de transaction)
          await generateEcheances(
            id,
            data.dateDebut || parrainageExistant.dateDebut,
            valeurKafalaPourEcheances,
            nombreParrainages,
            data.dateFin !== undefined ? data.dateFin : parrainageExistant.dateFin,
            tx
          )
        }
      }

      // Recalculer nombreParrainages et échéances si nécessaire
      await recomputeNombreParrainages(parrainageExistant.parrainId, tx)
      await recomputeEcheancesForParrain(parrainageExistant.parrainId, tx)

      return parrainageMisAJour
    })

    // Récupérer le parrainage complet
    const parrainageComplet = await prisma.parrainage.findUnique({
      where: { id: parrainage.id },
      include: {
        parrain: true,
        orphelin: true,
        echeances: true,
      },
    })

    return NextResponse.json(parrainageComplet)
  } catch (error: any) {
    if (error.code === 'P2025' || error.message === 'Parrainage non trouvé') {
      return NextResponse.json(
        { erreur: 'Parrainage non trouvé' },
        { status: 404 }
      )
    }
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { erreur: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erreur lors de la mise à jour du parrainage:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la mise à jour du parrainage' },
      { status: 500 }
    )
  }
}

// DELETE /api/parrainages/[id] - Supprime un parrainage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Supprimer les échéances d'abord (cascade)
    await prisma.echeance.deleteMany({
      where: { parrainageId: id },
    })

    await prisma.parrainage.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Parrainage supprimé avec succès' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { erreur: 'Parrainage non trouvé' },
        { status: 404 }
      )
    }
    console.error('Erreur lors de la suppression du parrainage:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la suppression du parrainage' },
      { status: 500 }
    )
  }
}

