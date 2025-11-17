import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VeuveUpdateSchema } from '@/lib/validation'

// GET /api/veuves/[id] - Récupère une veuve par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const veuve = await prisma.veuve.findUnique({
      where: { id },
      include: {
        orphelins: {
          include: {
            parrainages: {
              include: {
                parrain: {
                  select: {
                    id: true,
                    nom: true,
                    prenom: true,
                    valeurKafala: true,
                  },
                },
              },
              where: {
                dateFin: null,
              },
              orderBy: {
                dateDebut: 'desc',
              },
              take: 1,
            },
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
            orphelin: {
              select: {
                id: true,
                nom: true,
                prenom: true,
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

    if (!veuve) {
      return NextResponse.json(
        { erreur: 'Veuve non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json(veuve)
  } catch (error) {
    console.error('Erreur lors de la récupération de la veuve:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la récupération de la veuve' },
      { status: 500 }
    )
  }
}

// PATCH /api/veuves/[id] - Met à jour une veuve
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = VeuveUpdateSchema.parse(body)

    const veuve = await prisma.veuve.update({
      where: { id },
      data,
    })

    return NextResponse.json(veuve)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { erreur: 'Veuve non trouvée' },
        { status: 404 }
      )
    }
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { erreur: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erreur lors de la mise à jour de la veuve:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la mise à jour de la veuve' },
      { status: 500 }
    )
  }
}

// DELETE /api/veuves/[id] - Supprime une veuve
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.veuve.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Veuve supprimée avec succès' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { erreur: 'Veuve non trouvée' },
        { status: 404 }
      )
    }
    console.error('Erreur lors de la suppression de la veuve:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la suppression de la veuve' },
      { status: 500 }
    )
  }
}

