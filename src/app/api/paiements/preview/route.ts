import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { allocateKafalaPayment } from '@/lib/kafala'
import { prisma } from '@/lib/prisma'

const PreviewSchema = z.object({
  parrainId: z.string().min(1, 'Le parrain est requis'),
  montant: z.number().int().positive('Le montant doit être positif'),
})

// POST /api/paiements/preview - Prévisualise l'allocation d'un paiement Kafala
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = PreviewSchema.parse(body)

    // Appeler allocateKafalaPayment sans transaction (lecture seule)
    const allocationResult = await allocateKafalaPayment(data.parrainId, data.montant)

    // Enrichir avec les informations des orphelins et parrainages
    const allocationsEnrichies = await Promise.all(
      allocationResult.allocations.map(async (alloc) => {
        const [parrainage, echeance] = await Promise.all([
          prisma.parrainage.findUnique({
            where: { id: alloc.parrainageId },
            include: {
              orphelin: {
                select: {
                  id: true,
                  nom: true,
                  prenom: true,
                },
              },
            },
          }),
          prisma.echeance.findUnique({
            where: { id: alloc.echeanceId },
            select: {
              montantDu: true,
              montantPaye: true,
            },
          }),
        ])

        return {
          ...alloc,
          orphelinNom: parrainage?.orphelin.nom || '',
          orphelinPrenom: parrainage?.orphelin.prenom || '',
            montantDu: echeance?.montantDu 
              ? (typeof echeance.montantDu === 'object' ? echeance.montantDu.toNumber() : echeance.montantDu)
              : 0,
            montantPayeAvant: echeance?.montantPaye
              ? (typeof echeance.montantPaye === 'object' ? echeance.montantPaye.toNumber() : echeance.montantPaye)
              : 0,
            montantRestantEcheance: (() => {
              const montantDu = echeance?.montantDu
                ? (typeof echeance.montantDu === 'object' ? echeance.montantDu.toNumber() : echeance.montantDu)
                : 0
              const montantPaye = echeance?.montantPaye
                ? (typeof echeance.montantPaye === 'object' ? echeance.montantPaye.toNumber() : echeance.montantPaye)
                : 0
              return montantDu - montantPaye - alloc.montantAffecte
            })(),
        }
      })
    )

    return NextResponse.json({
      allocations: allocationsEnrichies,
      montantsParOrphelin: allocationResult.montantsParOrphelin,
      echeancesAffectees: allocationResult.echeancesAffectees,
      montantRestant: allocationResult.montantRestant,
      montantTotal: data.montant,
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { erreur: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    if (error.message === 'Aucun parrainage actif trouvé pour ce parrain') {
      return NextResponse.json(
        { erreur: 'Aucun parrainage actif trouvé pour ce parrain' },
        { status: 422 }
      )
    }
    console.error('Erreur lors de la prévisualisation:', error)
    return NextResponse.json(
      { erreur: error.message || 'Erreur lors de la prévisualisation' },
      { status: 500 }
    )
  }
}

