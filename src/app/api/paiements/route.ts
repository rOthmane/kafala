import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaiementCreateSchema } from '@/lib/validation'
import { allocatePaiementFIFO, allocateKafalaPayment } from '@/lib/kafala'
import { Prisma } from '@prisma/client'

// GET /api/paiements - Liste tous les paiements
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const parrainId = searchParams.get('parrainId')
    const orphelinId = searchParams.get('orphelinId')
    const veuveId = searchParams.get('veuveId')

    const where: any = {}
    if (parrainId) {
      where.parrainId = parrainId
    }
    if (orphelinId) {
      where.orphelinId = orphelinId
    }
    if (veuveId) {
      where.veuveId = veuveId
    }

    const paiements = await prisma.paiement.findMany({
      where,
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
    })

    return NextResponse.json(paiements)
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la récupération des paiements' },
      { status: 500 }
    )
  }
}

// POST /api/paiements - Crée un nouveau paiement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = PaiementCreateSchema.parse(body)

    let allocation: any = null
    let allocationResult: any = null

    // Si type est KAFALA, utiliser la nouvelle logique d'allocation
    if (data.type === 'KAFALA') {
      if (!data.parrainId) {
        return NextResponse.json(
          { erreur: 'Le parrain est requis pour un paiement Kafala' },
          { status: 400 }
        )
      }

      if (data.orphelinId || data.veuveId) {
        return NextResponse.json(
          { erreur: 'Les champs orphelin et veuve ne sont pas autorisés pour un paiement Kafala' },
          { status: 400 }
        )
      }

      // Utiliser l'allocation fournie si présente (depuis le preview édité), sinon calculer automatiquement
      if (body.allocation && Array.isArray(body.allocation)) {
        // Validation et mise à jour des échéances avec l'allocation fournie
        allocation = body.allocation

        // Mettre à jour les échéances dans une transaction
        await prisma.$transaction(async (tx) => {
          for (const alloc of allocation) {
            const echeance = await tx.echeance.findUnique({
              where: { id: alloc.echeanceId },
            })

            if (echeance) {
              const montantPayeActuel = typeof echeance.montantPaye === 'object' 
                ? echeance.montantPaye.toNumber() 
                : echeance.montantPaye
              const montantDuActuel = typeof echeance.montantDu === 'object'
                ? echeance.montantDu.toNumber()
                : echeance.montantDu
              
              const nouveauMontantPaye = montantPayeActuel + alloc.montantAffecte
              const soldée = nouveauMontantPaye >= montantDuActuel

              await tx.echeance.update({
                where: { id: alloc.echeanceId },
                data: {
                  montantPaye: new Prisma.Decimal(nouveauMontantPaye),
                  soldée,
                },
              })
            }
          }
        })
      } else {
        // Allocation automatique
        try {
          allocationResult = await prisma.$transaction(async (tx) => {
            return await allocateKafalaPayment(data.parrainId!, data.montant, tx)
          })

          allocation = allocationResult.allocations.map((a: any) => ({
            orphelinId: a.orphelinId,
            parrainageId: a.parrainageId,
            echeanceId: a.echeanceId,
            mois: a.mois,
            montantAffecte: a.montantAffecte,
          }))
        } catch (error: any) {
          if (error.message === 'Aucun parrainage actif trouvé pour ce parrain') {
            return NextResponse.json(
              { erreur: 'Aucun parrainage actif trouvé pour ce parrain' },
              { status: 422 }
            )
          }
          throw error
        }
      }
    } else if (data.orphelinId && data.parrainId) {
      // Ancienne logique pour les autres types (rétrocompatibilité)
      const parrainage = await prisma.parrainage.findFirst({
        where: {
          parrainId: data.parrainId,
          orphelinId: data.orphelinId,
          dateFin: null,
        },
        include: {
          echeances: {
            where: {
              soldée: false,
            },
            orderBy: {
              mois: 'asc',
            },
          },
        },
      })

      if (parrainage && parrainage.echeances.length > 0) {
        const allocationFIFO = allocatePaiementFIFO(data.montant, parrainage.echeances)

        for (const alloc of allocationFIFO) {
          const echeance = await prisma.echeance.findUnique({
            where: { id: alloc.echeanceId },
          })

          if (echeance) {
            const montantPayeActuel = typeof echeance.montantPaye === 'object'
              ? echeance.montantPaye.toNumber()
              : echeance.montantPaye
            const montantDuActuel = typeof echeance.montantDu === 'object'
              ? echeance.montantDu.toNumber()
              : echeance.montantDu
            
            const nouveauMontantPaye = montantPayeActuel + alloc.montantAlloue
            const soldée = nouveauMontantPaye >= montantDuActuel

            await prisma.echeance.update({
              where: { id: alloc.echeanceId },
              data: {
                montantPaye: new Prisma.Decimal(nouveauMontantPaye),
                soldée,
              },
            })
          }
        }

        allocation = allocationFIFO
      }
    }

    const paiement = await prisma.paiement.create({
      data: {
        ...data,
        montant: new Prisma.Decimal(data.montant),
        allocation: allocation ? allocation : undefined,
        datePaiement: data.datePaiement || new Date(),
      },
      include: {
        parrain: true,
        orphelin: true,
        veuve: true,
        recu: true,
      },
    })

    // Retourner avec les statistiques d'allocation pour KAFALA
    if (data.type === 'KAFALA' && allocationResult) {
      return NextResponse.json(
        {
          ...paiement,
          allocationStats: {
            nbOrphelins: Object.keys(allocationResult.montantsParOrphelin).length,
            nbEcheances: allocationResult.echeancesAffectees,
            montantRestant: allocationResult.montantRestant,
          },
        },
        { status: 201 }
      )
    }

    return NextResponse.json(paiement, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { erreur: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erreur lors de la création du paiement:', error)
    return NextResponse.json(
      { erreur: error.message || 'Erreur lors de la création du paiement' },
      { status: 500 }
    )
  }
}

