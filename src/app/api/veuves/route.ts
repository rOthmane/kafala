import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VeuveCreateSchema, VeuveUpdateSchema } from '@/lib/validation'

// GET /api/veuves - Liste toutes les veuves
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const cloturee = searchParams.get('cloturee')

    const where: any = {}
    if (cloturee !== null) {
      where.cloturee = cloturee === 'true'
    }

    const veuves = await prisma.veuve.findMany({
      where,
      include: {
        orphelins: {
          select: {
            id: true,
          },
        },
        paiements: {
          select: {
            montant: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const veuvesAvecStats = veuves.map((veuve) => ({
      id: veuve.id,
      nom: veuve.nom,
      prenom: veuve.prenom,
      cin: veuve.cin,
      rib: veuve.rib,
      tel: veuve.tel,
      adresse: veuve.adresse,
      cloturee: veuve.cloturee,
      nombreOrphelins: veuve.orphelins.length,
      totalPaiements: veuve.paiements.reduce((sum, p) => {
        const montant = typeof p.montant === 'object' && 'toNumber' in p.montant
          ? p.montant.toNumber()
          : Number(p.montant) || 0
        return sum + montant
      }, 0),
      createdAt: veuve.createdAt,
      updatedAt: veuve.updatedAt,
    }))

    return NextResponse.json(veuvesAvecStats)
  } catch (error) {
    console.error('Erreur lors de la récupération des veuves:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la récupération des veuves' },
      { status: 500 }
    )
  }
}

// POST /api/veuves - Crée une nouvelle veuve
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = VeuveCreateSchema.parse(body)

    const veuve = await prisma.veuve.create({
      data,
    })

    return NextResponse.json(veuve, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { erreur: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erreur lors de la création de la veuve:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la création de la veuve' },
      { status: 500 }
    )
  }
}

