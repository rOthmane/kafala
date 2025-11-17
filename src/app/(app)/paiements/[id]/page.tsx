import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

async function getPaiement(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (typeof window === 'undefined' ? 'http://localhost:3000' : '')
  const res = await fetch(`${baseUrl}/api/paiements/${id}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Paiement non trouvé')
    }
    throw new Error('Erreur lors de la récupération du paiement')
  }
  return res.json()
}

export default async function PaiementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const paiement = await getPaiement(id)

  const allocation =
    paiement.allocation && typeof paiement.allocation === 'object'
      ? (paiement.allocation as unknown as Array<{
          echeanceId: string
          montantAlloue: number
        }>)
      : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paiement</h1>
          <p className="text-muted-foreground mt-2">Détails du paiement</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/paiements">Retour</Link>
          </Button>
          <Button asChild>
            <Link href={`/paiements/${paiement.id}/edit`}>Modifier</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations du paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">Date:</span>{' '}
              <span>
                {new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Montant:</span>{' '}
              <span>
                {new Intl.NumberFormat('fr-MA', {
                  style: 'currency',
                  currency: 'MAD',
                }).format(paiement.montant)}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Type:</span>{' '}
              <span>{paiement.type}</span>
            </div>
            {paiement.parrain && (
              <div>
                <span className="text-sm font-medium">Parrain:</span>{' '}
                <Link
                  href={`/parrains/${paiement.parrain.id}`}
                  className="hover:underline"
                >
                  {paiement.parrain.nom} {paiement.parrain.prenom}
                </Link>
              </div>
            )}
            {paiement.orphelin && (
              <div>
                <span className="text-sm font-medium">Orphelin:</span>{' '}
                <Link
                  href={`/orphelins/${paiement.orphelin.id}`}
                  className="hover:underline"
                >
                  {paiement.orphelin.nom} {paiement.orphelin.prenom}
                </Link>
              </div>
            )}
            {paiement.veuve && (
              <div>
                <span className="text-sm font-medium">Veuve:</span>{' '}
                <Link
                  href={`/veuves/${paiement.veuve.id}`}
                  className="hover:underline"
                >
                  {paiement.veuve.nom} {paiement.veuve.prenom}
                </Link>
              </div>
            )}
            {paiement.recu && (
              <div>
                <span className="text-sm font-medium">Reçu:</span>{' '}
                <Link
                  href={`/recus/${paiement.recu.id}`}
                  className="hover:underline"
                >
                  {paiement.recu.numero}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {allocation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Allocation FIFO sur les échéances</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Échéance ID</TableHead>
                  <TableHead>Montant alloué</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocation.map((alloc, index) => (
                  <TableRow key={index}>
                    <TableCell>{alloc.echeanceId}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('fr-MA', {
                        style: 'currency',
                        currency: 'MAD',
                      }).format(alloc.montantAlloue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

