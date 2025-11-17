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

async function getRecu(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (typeof window === 'undefined' ? 'http://localhost:3000' : '')
  const res = await fetch(`${baseUrl}/api/recus/${id}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Reçu non trouvé')
    }
    throw new Error('Erreur lors de la récupération du reçu')
  }
  return res.json()
}

export default async function RecuDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const recu = await getRecu(id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reçu #{recu.numero}</h1>
          <p className="text-muted-foreground mt-2">Détails du reçu</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/recus">Retour</Link>
          </Button>
          <Button asChild>
            <Link href={`/recus/${recu.id}/edit`}>Modifier</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations du reçu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">Numéro:</span>{' '}
              <span className="font-medium">{recu.numero}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Date d'émission:</span>{' '}
              <span>
                {new Date(recu.dateEmission).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Total:</span>{' '}
              <span className="font-medium">
                {new Intl.NumberFormat('fr-MA', {
                  style: 'currency',
                  currency: 'MAD',
                }).format(recu.total)}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Type:</span>{' '}
              <span>{recu.type}</span>
            </div>
            {recu.parrain && (
              <div>
                <span className="text-sm font-medium">Parrain:</span>{' '}
                <Link
                  href={`/parrains/${recu.parrain.id}`}
                  className="hover:underline"
                >
                  {recu.parrain.nom} {recu.parrain.prenom}
                </Link>
              </div>
            )}
            {recu.ice && (
              <div>
                <span className="text-sm font-medium">ICE:</span>{' '}
                <span>{recu.ice}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paiements associés ({recu.paiements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Orphelin/Veuve</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recu.paiements.map((paiement: any) => (
                <TableRow key={paiement.id}>
                  <TableCell>
                    {new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {paiement.orphelin ? (
                      <Link
                        href={`/orphelins/${paiement.orphelin.id}`}
                        className="hover:underline"
                      >
                        {paiement.orphelin.nom} {paiement.orphelin.prenom}
                      </Link>
                    ) : paiement.veuve ? (
                      <Link
                        href={`/veuves/${paiement.veuve.id}`}
                        className="hover:underline"
                      >
                        {paiement.veuve.nom} {paiement.veuve.prenom}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('fr-MA', {
                      style: 'currency',
                      currency: 'MAD',
                    }).format(paiement.montant)}
                  </TableCell>
                  <TableCell>{paiement.type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

