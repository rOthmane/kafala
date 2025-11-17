import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ParrainageCreateSchema } from '@/lib/validation'
import { generateEcheances, recomputeNombreParrainages, recomputeEcheancesForParrain, isParrainageActive } from '@/lib/kafala'

// GET /api/parrainages - Liste tous les parrainages
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const parrainId = searchParams.get('parrainId')
    const orphelinId = searchParams.get('orphelinId')

    const where: any = {}
    if (parrainId) {
      where.parrainId = parrainId
    }
    if (orphelinId) {
      where.orphelinId = orphelinId
    }

    const parrainages = await prisma.parrainage.findMany({
      where,
      include: {
        parrain: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            valeurKafala: true,
          },
        },
        orphelin: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            dateNaissance: true,
          },
        },
        echeances: {
          select: {
            id: true,
            mois: true,
            montantDu: true,
            montantPaye: true,
            soldée: true,
          },
          orderBy: {
            mois: 'asc',
          },
        },
      },
      orderBy: {
        dateDebut: 'desc',
      },
    })

    const parrainagesAvecStats = parrainages.map((parrainage) => {
      const echeancesTotal = parrainage.echeances.length
      const echeancesSoldees = parrainage.echeances.filter((e) => e.soldée).length
      const montantTotal = parrainage.echeances.reduce((sum, e) => {
        const montant = typeof e.montantDu === 'object' && 'toNumber' in e.montantDu
          ? e.montantDu.toNumber()
          : Number(e.montantDu) || 0
        return sum + montant
      }, 0)
      const montantPaye = parrainage.echeances.reduce((sum, e) => {
        const montant = typeof e.montantPaye === 'object' && 'toNumber' in e.montantPaye
          ? e.montantPaye.toNumber()
          : Number(e.montantPaye) || 0
        return sum + montant
      }, 0)

      return {
        ...parrainage,
        active: isParrainageActive(parrainage.dateFin),
        statsEcheances: {
          total: echeancesTotal,
          soldees: echeancesSoldees,
          enAttente: echeancesTotal - echeancesSoldees,
          montantTotal,
          montantPaye,
          montantRestant: montantTotal - montantPaye,
        },
      }
    })

    return NextResponse.json(parrainagesAvecStats)
  } catch (error) {
    console.error('Erreur lors de la récupération des parrainages:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la récupération des parrainages' },
      { status: 500 }
    )
  }
}

// POST /api/parrainages - Crée un nouveau parrainage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { closePrevious, ...parrainageData } = body
    const data = ParrainageCreateSchema.parse(parrainageData)

    // Vérifier s'il existe un parrainage actif pour cet orphelin
    // Un parrainage est actif si dateFin est null OU si dateFin est dans le futur
    const maintenant = new Date()
    const parrainageActif = await prisma.parrainage.findFirst({
      where: {
        orphelinId: data.orphelinId,
        OR: [
          { dateFin: null },
          { dateFin: { gt: maintenant } },
        ],
      },
    })

    if (parrainageActif && !closePrevious) {
      return NextResponse.json(
        {
          erreur: 'Un parrainage actif existe déjà pour cet orphelin',
          parrainageActif: {
            id: parrainageActif.id,
            parrainId: parrainageActif.parrainId,
          },
        },
        { status: 400 }
      )
    }

    // Créer le parrainage et générer les échéances dans une transaction
    const parrainage = await prisma.$transaction(async (tx) => {
      // Clôturer le parrainage précédent si nécessaire
      if (parrainageActif && closePrevious) {
        await tx.parrainage.update({
          where: { id: parrainageActif.id },
          data: { dateFin: new Date() },
        })
      }

      const nouveauParrainage = await tx.parrainage.create({
        data,
      })

      // Recalculer nombreParrainages
      const nombreParrainages = await recomputeNombreParrainages(data.parrainId, tx)

      // Récupérer valeurKafala du parrain
      const parrain = await tx.parrain.findUnique({
        where: { id: data.parrainId },
        select: { valeurKafala: true },
      })

      if (!parrain) {
        throw new Error('Parrain non trouvé')
      }

      // Générer les échéances automatiquement (utiliser le client de transaction)
      await generateEcheances(
        nouveauParrainage.id,
        data.dateDebut,
        parrain.valeurKafala,
        nombreParrainages,
        data.dateFin || null,
        tx
      )

      // Recalculer les échéances pour tous les parrainages actifs
      await recomputeEcheancesForParrain(data.parrainId, tx)

      return nouveauParrainage
    })

    // Récupérer le parrainage avec ses relations
    const parrainageComplet = await prisma.parrainage.findUnique({
      where: { id: parrainage.id },
      include: {
        parrain: true,
        orphelin: true,
        echeances: true,
      },
    })

    return NextResponse.json(parrainageComplet, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { erreur: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erreur lors de la création du parrainage:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la création du parrainage' },
      { status: 500 }
    )
  }
}

