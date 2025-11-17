import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RecuCreateSchema } from '@/lib/validation'

// GET /api/recus - Liste tous les reçus
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const parrainId = searchParams.get('parrainId')
    const dateDebut = searchParams.get('dateDebut')
    const dateFin = searchParams.get('dateFin')

    const where: any = {}
    if (parrainId) {
      where.parrainId = parrainId
    }
    if (dateDebut || dateFin) {
      where.dateEmission = {}
      if (dateDebut) {
        where.dateEmission.gte = new Date(dateDebut)
      }
      if (dateFin) {
        where.dateEmission.lte = new Date(dateFin)
      }
    }

    const recus = await prisma.recu.findMany({
      where,
      include: {
        parrain: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            ice: true,
          },
        },
        paiements: {
          select: {
            id: true,
            montant: true,
            datePaiement: true,
          },
        },
      },
      orderBy: {
        dateEmission: 'desc',
      },
    })

    return NextResponse.json(recus)
  } catch (error) {
    console.error('Erreur lors de la récupération des reçus:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la récupération des reçus' },
      { status: 500 }
    )
  }
}

// POST /api/recus - Crée un nouveau reçu
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = RecuCreateSchema.parse(body)

    // Générer un numéro automatique si non fourni
    let numero = data.numero
    if (!numero) {
      // Trouver le dernier numéro et incrémenter
      const dernierRecu = await prisma.recu.findFirst({
        orderBy: {
          numero: 'desc',
        },
      })

      if (dernierRecu) {
        const dernierNumero = parseInt(dernierRecu.numero) || 0
        numero = String(dernierNumero + 1).padStart(6, '0')
      } else {
        numero = '000001'
      }
    }

    const recu = await prisma.recu.create({
      data: {
        ...data,
        numero,
        dateEmission: data.dateEmission || new Date(),
      },
      include: {
        parrain: true,
        paiements: true,
      },
    })

    return NextResponse.json(recu, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { erreur: 'Un reçu avec ce numéro existe déjà' },
        { status: 400 }
      )
    }
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { erreur: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erreur lors de la création du reçu:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de la création du reçu' },
      { status: 500 }
    )
  }
}

