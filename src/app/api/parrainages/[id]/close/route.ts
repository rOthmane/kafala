import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recomputeNombreParrainages, recomputeEcheancesForParrain } from '@/lib/kafala'

// PATCH /api/parrainages/[id]/close - Clôture un parrainage
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const parrainage = await prisma.$transaction(async (tx) => {
      const parrainageFerme = await tx.parrainage.update({
        where: { id },
        data: { dateFin: new Date() },
        include: {
          parrain: {
            select: {
              id: true,
              nom: true,
              prenom: true,
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
      })

      // Recalculer nombreParrainages et échéances
      await recomputeNombreParrainages(parrainageFerme.parrainId, tx)
      await recomputeEcheancesForParrain(parrainageFerme.parrainId, tx)

      return parrainageFerme
    })

    return NextResponse.json({
      ...parrainage,
      active: false,
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { erreur: 'Parrainage non trouvé' },
        { status: 404 }
      )
    }
    console.error('Erreur lors de la clôture du parrainage:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la clôture du parrainage' },
      { status: 500 }
    )
  }
}

