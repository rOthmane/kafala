import { prisma } from './prisma'
import type { Prisma, Decimal } from '@prisma/client'
import { Prisma as PrismaNamespace } from '@prisma/client'

// Helper pour convertir Decimal en number
function decimalToNumber(d: Decimal | number | string | null | undefined): number {
  if (d === null || d === undefined) return 0
  if (typeof d === 'number') return d
  if (typeof d === 'string') return parseFloat(d)
  return d.toNumber()
}

// Helper pour créer un Decimal depuis un number
function numberToDecimal(n: number): Decimal {
  return new PrismaNamespace.Decimal(n)
}

/**
 * Calcule l'âge à partir de la date de naissance
 */
export function calculateAge(dateNaissance: Date): number {
  const today = new Date()
  let age = today.getFullYear() - dateNaissance.getFullYear()
  const monthDiff = today.getMonth() - dateNaissance.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateNaissance.getDate())) {
    age--
  }
  
  return age
}

/**
 * Détermine si une alerte 18 ans doit être affichée (âge >= 17.5 ans)
 */
export function isAlerte18(age: number): boolean {
  return age >= 17.5
}

/**
 * Détermine si un parrainage est actif
 * Un parrainage est actif si dateFin est null OU si dateFin est dans le futur
 */
export function isParrainageActive(dateFin: Date | null | undefined): boolean {
  if (dateFin === null || dateFin === undefined) {
    return true
  }
  return dateFin > new Date()
}

/**
 * Récupère tous les parrainages actifs d'un parrain avec leurs échéances non soldées
 * Un parrainage est actif si dateFin est null OU si dateFin est dans le futur
 */
export async function getActiveParrainages(
  parrainId: string,
  tx?: Omit<Prisma.TransactionClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
) {
  const client = tx || prisma
  const maintenant = new Date()

  return await client.parrainage.findMany({
    where: {
      parrainId,
      OR: [
        { dateFin: null },
        { dateFin: { gt: maintenant } },
      ],
    },
    include: {
      orphelin: {
        select: {
          id: true,
          nom: true,
          prenom: true,
        },
      },
      echeances: {
        where: {
          soldée: false,
        },
        orderBy: {
          mois: 'asc',
        },
      },
    },
    orderBy: {
      dateDebut: 'asc',
    },
  })
}

/**
 * Recalcule et met à jour le nombre de parrainages actifs d'un parrain
 * Un parrainage est actif si dateFin est null OU si dateFin est dans le futur
 */
export async function recomputeNombreParrainages(
  parrainId: string,
  tx?: Omit<Prisma.TransactionClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
): Promise<number> {
  const client = tx || prisma
  const maintenant = new Date()

  const count = await client.parrainage.count({
    where: {
      parrainId,
      OR: [
        { dateFin: null },
        { dateFin: { gt: maintenant } },
      ],
    },
  })

  await client.parrain.update({
    where: { id: parrainId },
    data: { nombreParrainages: count },
  })

  return count
}

/**
 * Recalcule les montants des échéances non soldées pour un parrain
 * montantDu = valeurKafala / nombreParrainages pour chaque échéance non soldée
 */
export async function recomputeEcheancesForParrain(
  parrainId: string,
  tx?: Omit<Prisma.TransactionClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
): Promise<void> {
  const client = tx || prisma

  const parrain = await client.parrain.findUnique({
    where: { id: parrainId },
    select: {
      valeurKafala: true,
      nombreParrainages: true,
    },
  })

  if (!parrain) {
    throw new Error('Parrain non trouvé')
  }

  const valeurKafala = decimalToNumber(parrain.valeurKafala)
  const nombreParrainages = parrain.nombreParrainages || 1

  if (nombreParrainages === 0) {
    return // Pas de parrainages actifs, rien à recalculer
  }

  const montantParOrphelin = valeurKafala / nombreParrainages

  // Récupérer tous les parrainages actifs
  const parrainages = await getActiveParrainages(parrainId, client as any)

  // Mettre à jour toutes les échéances non soldées
  for (const parrainage of parrainages) {
    await client.echeance.updateMany({
      where: {
        parrainageId: parrainage.id,
        soldée: false,
      },
      data: {
        montantDu: new PrismaNamespace.Decimal(montantParOrphelin),
      },
    })
  }
}

/**
 * Génère automatiquement les échéances mensuelles pour un parrainage
 * montantDu = valeurKafala / nombreParrainages
 */
export async function generateEcheances(
  parrainageId: string,
  dateDebut: Date,
  valeurKafala: number | Decimal,
  nombreParrainages: number,
  dateFin?: Date | null,
  tx?: Omit<Prisma.TransactionClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
): Promise<void> {
  const valeurKafalaNum = decimalToNumber(valeurKafala)
  const montantParOrphelin = nombreParrainages > 0 ? valeurKafalaNum / nombreParrainages : valeurKafalaNum

  const echeances: Array<{ parrainageId: string; mois: Date; montantDu: number }> = []
  
  // Commencer au premier jour du mois de début
  const debut = new Date(dateDebut.getFullYear(), dateDebut.getMonth(), 1)
  const fin = dateFin 
    ? new Date(dateFin.getFullYear(), dateFin.getMonth(), 1)
    : new Date(new Date().getFullYear(), new Date().getMonth() + 12, 1) // 12 mois par défaut

  let moisCourant = new Date(debut)

  while (moisCourant < fin) {
    echeances.push({
      parrainageId,
      mois: new Date(moisCourant),
      montantDu: montantParOrphelin,
    })

    // Passer au mois suivant
    moisCourant = new Date(moisCourant.getFullYear(), moisCourant.getMonth() + 1, 1)
  }

  // Utiliser le client de transaction si fourni, sinon utiliser prisma directement
  const client = tx || prisma

  // Créer toutes les échéances en une seule transaction
  await client.echeance.createMany({
    data: echeances.map(e => ({
      parrainageId: e.parrainageId,
      mois: e.mois,
      montantDu: new PrismaNamespace.Decimal(e.montantDu),
    })),
    skipDuplicates: true,
  })
}

/**
 * Alloue un paiement Kafala selon la nouvelle logique :
 * - Le montant payé est alloué par orphelin par mois (FIFO)
 * - Chaque orphelin a montantDu = valeurKafala / nombreParrainages par mois
 */
export async function allocateKafalaPayment(
  parrainId: string,
  montant: number | Decimal,
  tx?: Omit<Prisma.TransactionClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
): Promise<{
  allocations: Array<{
    orphelinId: string
    parrainageId: string
    echeanceId: string
    mois: Date
    montantAffecte: number
  }>
  montantsParOrphelin: Record<string, number>
  echeancesAffectees: number
  montantRestant: number
}> {
  const client = tx || prisma
  const montantNum = decimalToNumber(montant)

  // 1. Recalculer nombreParrainages et échéances
  await recomputeNombreParrainages(parrainId, client as any)
  await recomputeEcheancesForParrain(parrainId, client as any)

  // 2. Récupérer les parrainages actifs avec échéances
  const parrainages = await getActiveParrainages(parrainId, client as any)

  if (parrainages.length === 0) {
    throw new Error('Aucun parrainage actif trouvé pour ce parrain')
  }

  // 3. Récupérer le parrain pour obtenir valeurKafala et nombreParrainages
  const parrain = await client.parrain.findUnique({
    where: { id: parrainId },
    select: {
      valeurKafala: true,
      nombreParrainages: true,
    },
  })

  if (!parrain) {
    throw new Error('Parrain non trouvé')
  }

  const valeurKafala = decimalToNumber(parrain.valeurKafala)
  const nombreParrainages = parrain.nombreParrainages || 1
  const partParOrphelin = valeurKafala / nombreParrainages

  // 4. Générer les échéances manquantes jusqu'au mois courant + 12 mois
  const maintenant = new Date()
  const finGeneration = new Date(maintenant.getFullYear(), maintenant.getMonth() + 12, 1)

  for (const parrainage of parrainages) {
    const derniereEcheance = parrainage.echeances.length > 0
      ? parrainage.echeances[parrainage.echeances.length - 1].mois
      : null

    if (!derniereEcheance || derniereEcheance < finGeneration) {
      const dateDebutGen = derniereEcheance
        ? new Date(derniereEcheance.getFullYear(), derniereEcheance.getMonth() + 1, 1)
        : new Date(parrainage.dateDebut.getFullYear(), parrainage.dateDebut.getMonth(), 1)

      await generateEcheances(
        parrainage.id,
        dateDebutGen,
        valeurKafala,
        nombreParrainages,
        null,
        client as any
      )
    }
  }

  // 5. Recharger les échéances après génération
  const parrainagesAvecEcheances = await Promise.all(
    parrainages.map(async (p) => {
      const echeances = await client.echeance.findMany({
        where: {
          parrainageId: p.id,
          soldée: false,
        },
        orderBy: {
          mois: 'asc',
        },
      })
      return { ...p, echeances }
    })
  )

  // 6. Allouer le montant payé équitablement entre les orphelins, puis FIFO par orphelin
  const allocations: Array<{
    orphelinId: string
    parrainageId: string
    echeanceId: string
    mois: Date
    montantAffecte: number
  }> = []

  const montantsParOrphelin: Record<string, number> = {}
  
  // Calculer le montant par orphelin (répartition équitable)
  const nbOrphelins = parrainagesAvecEcheances.length
  const montantParOrphelin = montantNum / nbOrphelins

  // Parcourir orphelin par orphelin
  for (const parrainage of parrainagesAvecEcheances) {
    let montantAlloueOrphelin = 0
    let montantRestantOrphelin = montantParOrphelin

    // Pour chaque orphelin, allouer son montant en FIFO sur ses échéances
    for (const echeance of parrainage.echeances) {
      if (montantRestantOrphelin <= 0) break

      const montantDu = decimalToNumber(echeance.montantDu)
      const montantPaye = decimalToNumber(echeance.montantPaye)
      const montantRestantEcheance = montantDu - montantPaye

      if (montantRestantEcheance > 0) {
        const montantAffecte = Math.min(montantRestantOrphelin, montantRestantEcheance)

        allocations.push({
          orphelinId: parrainage.orphelinId,
          parrainageId: parrainage.id,
          echeanceId: echeance.id,
          mois: echeance.mois,
          montantAffecte,
        })

        montantAlloueOrphelin += montantAffecte
        montantRestantOrphelin -= montantAffecte

        // Mettre à jour l'échéance seulement si on est dans une transaction (mode création)
        if (tx) {
          const nouveauMontantPaye = montantPaye + montantAffecte
          const soldée = nouveauMontantPaye >= montantDu

          await client.echeance.update({
            where: { id: echeance.id },
            data: {
              montantPaye: new PrismaNamespace.Decimal(nouveauMontantPaye),
              soldée,
            },
          })
        }
      }
    }

    montantsParOrphelin[parrainage.orphelinId] = montantAlloueOrphelin
  }

  // Calculer le montant restant total (peut être > 0 si certains orphelins n'ont pas assez d'échéances)
  const montantTotalAlloue = allocations.reduce((sum, a) => sum + a.montantAffecte, 0)
  const montantRestant = montantNum - montantTotalAlloue

  // Compter les échéances affectées
  const echeancesAffectees = new Set(allocations.map((a) => a.echeanceId)).size

  return {
    allocations,
    montantsParOrphelin,
    echeancesAffectees,
    montantRestant,
  }
}

/**
 * Alloue un paiement selon la méthode FIFO aux échéances les plus anciennes non soldées
 * (Fonction legacy pour compatibilité avec autres types de paiements)
 */
export function allocatePaiementFIFO(
  montant: number,
  echeances: Array<{ id: string; mois: Date; montantDu: Decimal | number; montantPaye: Decimal | number; soldée: boolean }>
): Array<{ echeanceId: string; montantAlloue: number }> {
  const allocation: Array<{ echeanceId: string; montantAlloue: number }> = []
  let montantRestant = montant

  // Trier les échéances par mois (plus anciennes en premier) et filtrer celles non soldées
  const echeancesNonSoldees = echeances
    .filter(e => !e.soldée)
    .sort((a, b) => a.mois.getTime() - b.mois.getTime())

  for (const echeance of echeancesNonSoldees) {
    if (montantRestant <= 0) break

    const montantDu = decimalToNumber(echeance.montantDu)
    const montantPaye = decimalToNumber(echeance.montantPaye)
    const montantRestantEcheance = montantDu - montantPaye

    if (montantRestantEcheance > 0) {
      const montantAlloue = Math.min(montantRestant, montantRestantEcheance)
      allocation.push({
        echeanceId: echeance.id,
        montantAlloue,
      })
      montantRestant -= montantAlloue
    }
  }

  return allocation
}
