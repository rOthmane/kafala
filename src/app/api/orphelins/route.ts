import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OrphelinCreateSchema } from '@/lib/validation'
import { calculateAge, isAlerte18 } from '@/lib/kafala'

// GET /api/orphelins - Liste tous les orphelins
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const cloture = searchParams.get('cloture')
    const veuveId = searchParams.get('veuveId')

    const where: any = {}
    if (cloture !== null) {
      where.cloture = cloture === 'true'
    }
    if (veuveId) {
      where.veuveId = veuveId
    }

    const orphelins = await prisma.orphelin.findMany({
      where,
      include: {
        veuve: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            rib: true,
          },
        },
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    const orphelinsAvecAge = orphelins.map((orphelin) => {
      const age = calculateAge(orphelin.dateNaissance)
      return {
        id: orphelin.id,
        nom: orphelin.nom,
        prenom: orphelin.prenom,
        dateNaissance: orphelin.dateNaissance,
        age,
        alerte18: isAlerte18(age),
        veuve: orphelin.veuve,
        parrainActuel: orphelin.parrainages[0]?.parrain || null,
        cloture: orphelin.cloture,
        suiviScolaire: orphelin.suiviScolaire,
        createdAt: orphelin.createdAt,
        updatedAt: orphelin.updatedAt,
      }
    })

    return NextResponse.json(orphelinsAvecAge)
  } catch (error) {
    console.error('Erreur lors de la récupération des orphelins:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la récupération des orphelins' },
      { status: 500 }
    )
  }
}

// POST /api/orphelins - Crée un nouvel orphelin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = OrphelinCreateSchema.parse(body)

    const orphelin = await prisma.orphelin.create({
      data: {
        ...data,
        ageCache: calculateAge(data.dateNaissance),
      },
      include: {
        veuve: true,
      },
    })

    return NextResponse.json(orphelin, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { erreur: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erreur lors de la création de l\'orphelin:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la création de l\'orphelin' },
      { status: 500 }
    )
  }
}

