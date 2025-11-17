import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RecuUpdateSchema } from '@/lib/validation'

// GET /api/recus/[id] - Récupère un reçu par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const recu = await prisma.recu.findUnique({
      where: { id },
      include: {
        parrain: true,
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
          },
        },
      },
    })

    if (!recu) {
      return NextResponse.json(
        { erreur: 'Reçu non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(recu)
  } catch (error) {
    console.error('Erreur lors de la récupération du reçu:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la récupération du reçu' },
      { status: 500 }
    )
  }
}

// PATCH /api/recus/[id] - Met à jour un reçu
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = RecuUpdateSchema.parse(body)

    const recu = await prisma.recu.update({
      where: { id },
      data,
      include: {
        parrain: true,
        paiements: true,
      },
    })

    return NextResponse.json(recu)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { erreur: 'Reçu non trouvé' },
        { status: 404 }
      )
    }
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { erreur: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erreur lors de la mise à jour du reçu:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la mise à jour du reçu' },
      { status: 500 }
    )
  }
}

// DELETE /api/recus/[id] - Supprime un reçu
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.recu.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Reçu supprimé avec succès' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { erreur: 'Reçu non trouvé' },
        { status: 404 }
      )
    }
    console.error('Erreur lors de la suppression du reçu:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la suppression du reçu' },
      { status: 500 }
    )
  }
}

