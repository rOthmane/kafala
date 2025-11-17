import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OrphelinUpdateSchema } from '@/lib/validation'
import { calculateAge, isAlerte18, isParrainageActive } from '@/lib/kafala'

// GET /api/orphelins/[id] - Récupère un orphelin par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orphelin = await prisma.orphelin.findUnique({
      where: { id },
      include: {
        veuve: true,
        parrainages: {
          include: {
            parrain: true,
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
        paiements: {
          include: {
            parrain: {
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
            parrain: {
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
      },
    })

    if (!orphelin) {
      return NextResponse.json(
        { erreur: 'Orphelin non trouvé' },
        { status: 404 }
      )
    }

    const age = calculateAge(orphelin.dateNaissance)
    const alerte18 = isAlerte18(age)

    // Ajouter le flag active aux parrainages
    const orphelinAvecActive = {
      ...orphelin,
      age,
      alerte18,
      parrainages: orphelin.parrainages.map((p: any) => ({
        ...p,
        active: isParrainageActive(p.dateFin),
      })),
    }

    return NextResponse.json(orphelinAvecActive)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'orphelin:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la récupération de l\'orphelin' },
      { status: 500 }
    )
  }
}

// PATCH /api/orphelins/[id] - Met à jour un orphelin
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = OrphelinUpdateSchema.parse(body)

    // Recalculer l'âge si la date de naissance change
    const updateData: any = { ...data }
    if (data.dateNaissance) {
      updateData.ageCache = calculateAge(data.dateNaissance)
    }

    const orphelin = await prisma.orphelin.update({
      where: { id },
      data: updateData,
      include: {
        veuve: true,
      },
    })

    return NextResponse.json(orphelin)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { erreur: 'Orphelin non trouvé' },
        { status: 404 }
      )
    }
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { erreur: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erreur lors de la mise à jour de l\'orphelin:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la mise à jour de l\'orphelin' },
      { status: 500 }
    )
  }
}

// DELETE /api/orphelins/[id] - Supprime un orphelin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.orphelin.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Orphelin supprimé avec succès' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { erreur: 'Orphelin non trouvé' },
        { status: 404 }
      )
    }
    console.error('Erreur lors de la suppression de l\'orphelin:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la suppression de l\'orphelin' },
      { status: 500 }
    )
  }
}

