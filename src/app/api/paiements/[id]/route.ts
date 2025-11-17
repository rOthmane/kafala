import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaiementUpdateSchema } from '@/lib/validation'

// GET /api/paiements/[id] - Récupère un paiement par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const paiement = await prisma.paiement.findUnique({
      where: { id },
      include: {
        parrain: true,
        orphelin: {
          include: {
            veuve: true,
          },
        },
        veuve: true,
        recu: true,
      },
    })

    if (!paiement) {
      return NextResponse.json(
        { erreur: 'Paiement non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(paiement)
  } catch (error) {
    console.error('Erreur lors de la récupération du paiement:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la récupération du paiement' },
      { status: 500 }
    )
  }
}

// PATCH /api/paiements/[id] - Met à jour un paiement
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = PaiementUpdateSchema.parse(body)

    const paiement = await prisma.paiement.update({
      where: { id },
      data,
      include: {
        parrain: true,
        orphelin: true,
        veuve: true,
        recu: true,
      },
    })

    return NextResponse.json(paiement)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { erreur: 'Paiement non trouvé' },
        { status: 404 }
      )
    }
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { erreur: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erreur lors de la mise à jour du paiement:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la mise à jour du paiement' },
      { status: 500 }
    )
  }
}

// DELETE /api/paiements/[id] - Supprime un paiement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Récupérer le paiement pour inverser l'allocation si nécessaire
    const paiement = await prisma.paiement.findUnique({
      where: { id },
    })

    if (paiement && paiement.allocation && typeof paiement.allocation === 'object') {
      const allocation = paiement.allocation as unknown as Array<{ echeanceId: string; montantAlloue: number }>

      // Inverser l'allocation sur les échéances
      for (const alloc of allocation) {
        const echeance = await prisma.echeance.findUnique({
          where: { id: alloc.echeanceId },
        })

        if (echeance) {
          const montantPayeNum = typeof echeance.montantPaye === 'object' && 'toNumber' in echeance.montantPaye
            ? echeance.montantPaye.toNumber()
            : Number(echeance.montantPaye) || 0
          const montantDuNum = typeof echeance.montantDu === 'object' && 'toNumber' in echeance.montantDu
            ? echeance.montantDu.toNumber()
            : Number(echeance.montantDu) || 0
          const nouveauMontantPaye = Math.max(0, montantPayeNum - alloc.montantAlloue)
          const soldée = nouveauMontantPaye >= montantDuNum

          await prisma.echeance.update({
            where: { id: alloc.echeanceId },
            data: {
              montantPaye: nouveauMontantPaye,
              soldée,
            },
          })
        }
      }
    }

    await prisma.paiement.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Paiement supprimé avec succès' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { erreur: 'Paiement non trouvé' },
        { status: 404 }
      )
    }
    console.error('Erreur lors de la suppression du paiement:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la suppression du paiement' },
      { status: 500 }
    )
  }
}

