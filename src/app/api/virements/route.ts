import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VirementCreateSchema } from '@/lib/validation'

// GET /api/virements - Liste tous les virements
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

    const virements = await prisma.virement.findMany({
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
    })

    return NextResponse.json(virements)
  } catch (error) {
    console.error('Erreur lors de la récupération des virements:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la récupération des virements' },
      { status: 500 }
    )
  }
}

// POST /api/virements - Crée un nouveau virement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = VirementCreateSchema.parse(body)

    const virement = await prisma.virement.create({
      data: {
        ...data,
        dateVirement: data.dateVirement || new Date(),
      },
      include: {
        veuve: true,
        orphelin: true,
        parrain: true,
      },
    })

    return NextResponse.json(virement, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { erreur: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erreur lors de la création du virement:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la création du virement' },
      { status: 500 }
    )
  }
}

