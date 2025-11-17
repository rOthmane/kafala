import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateAge, isAlerte18 } from '@/lib/kafala'
import { Prisma } from '@prisma/client'

// Helper pour convertir Decimal en number
function decimalToNumber(d: Prisma.Decimal | number | string | null | undefined): number {
  if (d === null || d === undefined) return 0
  if (typeof d === 'number') return d
  if (typeof d === 'string') return parseFloat(d)
  return d.toNumber()
}

// Helper pour convertir une date en format YYYY-MM
function formatMois(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Interface pour les allocations
interface AllocationItem {
  orphelinId: string
  parrainageId: string
  echeanceId: string
  mois: Date | string
  montantAffecte: number
}

/**
 * Calcule les encaissements par mois d'échéance en utilisant les allocations des paiements
 * Retourne une Map avec tous les mois d'échéance et leurs montants alloués
 * Fallback sur datePaiement pour les paiements sans allocation (anciens paiements)
 */
async function calculateEncaissementsParMoisEcheance(): Promise<Map<string, number>> {
  // Récupérer tous les paiements KAFALA avec leurs allocations
  const paiements = await prisma.paiement.findMany({
    where: {
      type: 'KAFALA',
    },
    select: {
      allocation: true,
      datePaiement: true,
      montant: true,
    },
  })

  const encaissementsParMois = new Map<string, number>()

  for (const paiement of paiements) {
    // Si le paiement a une allocation, utiliser les allocations
    if (paiement.allocation && Array.isArray(paiement.allocation)) {
      const allocations = paiement.allocation as AllocationItem[]
      for (const alloc of allocations) {
        const moisEcheance = formatMois(alloc.mois)
        const montant = alloc.montantAffecte || 0

        // Ajouter le montant alloué à ce mois d'échéance
        const total = encaissementsParMois.get(moisEcheance) || 0
        encaissementsParMois.set(moisEcheance, total + montant)
      }
    } else {
      // Fallback : utiliser datePaiement pour les anciens paiements sans allocation
      // On considère que le paiement finance le mois de paiement
      const moisPaiement = formatMois(paiement.datePaiement)
      const montant = decimalToNumber(paiement.montant)
      const total = encaissementsParMois.get(moisPaiement) || 0
      encaissementsParMois.set(moisPaiement, total + montant)
    }
  }

  return encaissementsParMois
}

// GET /api/dashboard - Récupère les KPIs du tableau de bord
export async function GET() {
  try {
    const maintenant = new Date()
    const moisActuel = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
    const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0, 23, 59, 59)
    const limite6Mois = new Date(maintenant.getFullYear(), maintenant.getMonth() - 6, 1)

    // Nombre de parrains
    const nombreParrains = await prisma.parrain.count()

    // Nombre d'orphelins
    const nombreOrphelins = await prisma.orphelin.count({
      where: {
        cloture: false,
      },
    })

    // Nombre de veuves
    const nombreVeuves = await prisma.veuve.count({
      where: {
        cloturee: false,
      },
    })

    // Montant Kafala du mois (paiements du mois en cours)
    const paiementsDuMois = await prisma.paiement.findMany({
      where: {
        datePaiement: {
          gte: debutMois,
          lte: finMois,
        },
        type: 'KAFALA',
      },
      select: {
        montant: true,
      },
    })

    const montantKafalaMois = paiementsDuMois.reduce(
      (sum, p) => sum + decimalToNumber(p.montant),
      0
    )

    // Alertes 18 ans (orphelins avec âge >= 17.5 ans)
    const orphelins = await prisma.orphelin.findMany({
      where: {
        cloture: false,
      },
      select: {
        dateNaissance: true,
      },
    })

    const alertes18 = orphelins.filter((orphelin) => {
      const age = calculateAge(orphelin.dateNaissance)
      return isAlerte18(age)
    }).length

    // 1. Parrains avec plus de 6 mois de retard
    const echeancesEnRetard = await prisma.echeance.findMany({
      where: {
        soldée: false,
        mois: {
          lt: limite6Mois,
        },
      },
      select: {
        parrainage: {
          select: {
            parrainId: true,
          },
        },
      },
    })

    const parrainsEnRetard = new Set(
      echeancesEnRetard.map((e) => e.parrainage.parrainId)
    ).size

    // 2. Échéances prévues par mois (12 derniers mois + mois actuel + 11 mois à venir)
    const echeancesPrevuesParMois: Array<{ mois: string; montant: number }> = []
    for (let i = -12; i <= 11; i++) {
      const mois = new Date(maintenant.getFullYear(), maintenant.getMonth() + i, 1)
      const moisStr = `${mois.getFullYear()}-${String(mois.getMonth() + 1).padStart(2, '0')}`

      const echeances = await prisma.echeance.findMany({
        where: {
          mois: {
            gte: new Date(mois.getFullYear(), mois.getMonth(), 1),
            lt: new Date(mois.getFullYear(), mois.getMonth() + 1, 1),
          },
        },
        select: {
          montantDu: true,
        },
      })

      const montant = echeances.reduce(
        (sum, e) => sum + decimalToNumber(e.montantDu),
        0
      )

      echeancesPrevuesParMois.push({ mois: moisStr, montant })
    }

    // 3. Échéances encaissées par mois (12 derniers mois) - Basé sur les allocations
    // Calculer les encaissements par mois d'échéance en utilisant les allocations
    const encaissementsParMoisMap = await calculateEncaissementsParMoisEcheance()

    const echeancesEncaisseesParMois: Array<{ mois: string; montant: number }> = []
    for (let i = -11; i <= 0; i++) {
      const mois = new Date(maintenant.getFullYear(), maintenant.getMonth() + i, 1)
      const moisStr = `${mois.getFullYear()}-${String(mois.getMonth() + 1).padStart(2, '0')}`

      // Récupérer le montant alloué à ce mois d'échéance depuis les allocations
      const montant = encaissementsParMoisMap.get(moisStr) || 0

      echeancesEncaisseesParMois.push({ mois: moisStr, montant })
    }

    // 4. Taux de recouvrement (12 derniers mois)
    // Comparer les montants alloués aux échéances (via allocations) avec les montants prévus
    const montantPrevu12Mois = echeancesEncaisseesParMois.reduce((sum, encaisse) => {
      const prevu = echeancesPrevuesParMois.find((p) => p.mois === encaisse.mois)
      return sum + (prevu?.montant || 0)
    }, 0)
    const montantAlloue12Mois = echeancesEncaisseesParMois.reduce(
      (sum, e) => sum + e.montant,
      0
    )
    const tauxRecouvrement =
      montantPrevu12Mois > 0 ? (montantAlloue12Mois / montantPrevu12Mois) * 100 : 0

    // 5. Montant total de Kafala prévu ce mois
    const echeancesMoisActuel = await prisma.echeance.findMany({
      where: {
        mois: {
          gte: moisActuel,
          lt: new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 1),
        },
      },
      select: {
        montantDu: true,
      },
    })

    const montantKafalaPrevuMois = echeancesMoisActuel.reduce(
      (sum, e) => sum + decimalToNumber(e.montantDu),
      0
    )

    // 6. Parrains actifs vs inactifs
    const parrainsAvecParrainagesActifs = await prisma.parrain.findMany({
      where: {
        parrainages: {
          some: {
            dateFin: null,
          },
        },
      },
      select: {
        id: true,
      },
    })

    const parrainsActifs = parrainsAvecParrainagesActifs.length
    const parrainsInactifs = nombreParrains - parrainsActifs

    // 7. Distribution des orphelins par tranche d'âge
    const orphelinsAvecAge = await prisma.orphelin.findMany({
      where: {
        cloture: false,
      },
      select: {
        dateNaissance: true,
      },
    })

    const distributionAges = {
      '0-5': 0,
      '6-10': 0,
      '11-15': 0,
      '16-18': 0,
    }

    orphelinsAvecAge.forEach((orphelin) => {
      const age = calculateAge(orphelin.dateNaissance)
      if (age >= 0 && age <= 5) distributionAges['0-5']++
      else if (age >= 6 && age <= 10) distributionAges['6-10']++
      else if (age >= 11 && age <= 15) distributionAges['11-15']++
      else if (age >= 16 && age <= 18) distributionAges['16-18']++
    })

    // 8. Top 5 parrains par montant total versé (12 derniers mois)
    const debut12Mois = new Date(maintenant.getFullYear(), maintenant.getMonth() - 12, 1)
    const paiements12Mois = await prisma.paiement.findMany({
      where: {
        datePaiement: {
          gte: debut12Mois,
        },
        type: 'KAFALA',
        parrainId: {
          not: null,
        },
      },
      select: {
        parrainId: true,
        montant: true,
        parrain: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
    })

    const montantsParParrain: Record<string, { nom: string; prenom: string; montant: number }> =
      {}
    paiements12Mois.forEach((p) => {
      if (p.parrainId && p.parrain) {
        if (!montantsParParrain[p.parrainId]) {
          montantsParParrain[p.parrainId] = {
            nom: p.parrain.nom,
            prenom: p.parrain.prenom || '',
            montant: 0,
          }
        }
        montantsParParrain[p.parrainId].montant += decimalToNumber(p.montant)
      }
    })

    const topParrains = Object.entries(montantsParParrain)
      .map(([parrainId, data]) => ({
        parrainId,
        nom: data.nom,
        prenom: data.prenom,
        montantTotal: data.montant,
      }))
      .sort((a, b) => b.montantTotal - a.montantTotal)
      .slice(0, 5)

    // 9. Évolution mensuelle des paiements (12 derniers mois)
    // Utiliser les montants alloués aux échéances (via allocations) pour cohérence
    const evolutionPaiements = echeancesEncaisseesParMois.map((e) => ({
      mois: e.mois,
      montant: e.montant, // Montant alloué à ce mois d'échéance
    }))

    // 10. Échéances en retard par mois (non soldées, mois < mois actuel)
    const echeancesEnRetardParMois: Array<{ mois: string; nombre: number }> = []
    for (let i = -11; i <= 0; i++) {
      const mois = new Date(maintenant.getFullYear(), maintenant.getMonth() + i, 1)
      const moisStr = `${mois.getFullYear()}-${String(mois.getMonth() + 1).padStart(2, '0')}`
      const moisSuivant = new Date(mois.getFullYear(), mois.getMonth() + 1, 1)

      // Compter les échéances non soldées de ce mois qui sont en retard (mois < mois actuel)
      if (mois < moisActuel) {
        const echeances = await prisma.echeance.count({
          where: {
            mois: {
              gte: mois,
              lt: moisSuivant,
            },
            soldée: false,
          },
        })

        echeancesEnRetardParMois.push({ mois: moisStr, nombre: echeances })
      } else {
        echeancesEnRetardParMois.push({ mois: moisStr, nombre: 0 })
      }
    }

    // 11. Montant moyen par parrain
    const parrainsAvecValeurKafala = await prisma.parrain.findMany({
      where: {
        parrainages: {
          some: {
            dateFin: null,
          },
        },
      },
      select: {
        valeurKafala: true,
      },
    })

    const montantMoyenParParrain =
      parrainsAvecValeurKafala.length > 0
        ? parrainsAvecValeurKafala.reduce(
            (sum, p) => sum + decimalToNumber(p.valeurKafala),
            0
          ) / parrainsAvecValeurKafala.length
        : 0

    // 12. Taux de paiement mensuel (% de parrains ayant payé ce mois)
    const parrainsAyantPayeCeMois = await prisma.paiement.findMany({
      where: {
        datePaiement: {
          gte: debutMois,
          lte: finMois,
        },
        type: 'KAFALA',
        parrainId: {
          not: null,
        },
      },
      select: {
        parrainId: true,
      },
      distinct: ['parrainId'],
    })

    const tauxPaiementMensuel =
      parrainsActifs > 0 ? (parrainsAyantPayeCeMois.length / parrainsActifs) * 100 : 0

    return NextResponse.json({
      nombreParrains,
      nombreOrphelins,
      nombreVeuves,
      montantKafalaMois,
      alertes18,
      // Nouveaux KPIs
      parrainsEnRetard,
      echeancesPrevuesParMois,
      echeancesEncaisseesParMois,
      tauxRecouvrement,
      montantKafalaPrevuMois,
      parrainsActifsVsInactifs: {
        actifs: parrainsActifs,
        inactifs: parrainsInactifs,
      },
      distributionAges: Object.entries(distributionAges).map(([tranche, nombre]) => ({
        tranche,
        nombre,
      })),
      topParrains,
      evolutionPaiements,
      echeancesEnRetardParMois,
      montantMoyenParParrain,
      tauxPaiementMensuel,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des KPIs:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la récupération des KPIs' },
      { status: 500 }
    )
  }
}
