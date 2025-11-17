import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VirementUpdateSchema } from '@/lib/validation'

// GET /api/virements/[id] - Récupère un virement par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const virement = await prisma.virement.findUnique({
      where: { id },
      include: {
        veuve: true,
        orphelin: {
          include: {
            veuve: true,
          },
        },
        parrain: true,
      },
    })

    if (!virement) {
      return NextResponse.json(
        { erreur: 'Virement non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(virement)
  } catch (error) {
    console.error('Erreur lors de la récupération du virement:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la récupération du virement' },
      { status: 500 }
    )
  }
}

// PATCH /api/virements/[id] - Met à jour un virement
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = VirementUpdateSchema.parse(body)

    const virement = await prisma.virement.update({
      where: { id },
      data,
      include: {
        veuve: true,
        orphelin: true,
        parrain: true,
      },
    })

    return NextResponse.json(virement)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { erreur: 'Virement non trouvé' },
        { status: 404 }
      )
    }
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { erreur: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erreur lors de la mise à jour du virement:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la mise à jour du virement' },
      { status: 500 }
    )
  }
}

// DELETE /api/virements/[id] - Supprime un virement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.virement.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Virement supprimé avec succès' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { erreur: 'Virement non trouvé' },
        { status: 404 }
      )
    }
    console.error('Erreur lors de la suppression du virement:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la suppression du virement' },
      { status: 500 }
    )
  }
}

