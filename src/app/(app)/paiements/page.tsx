import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

async function getPaiements() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (typeof window === 'undefined' ? 'http://localhost:3000' : '')
  const res = await fetch(`${baseUrl}/api/paiements`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error('Erreur lors du chargement des paiements')
  }
  return res.json()
}

export default async function PaiementsPage() {
  const paiements = await getPaiements()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paiements</h1>
          <p className="text-muted-foreground mt-2">
            Liste de tous les paiements enregistrés
          </p>
        </div>
        <Button asChild>
          <Link href="/paiements/new">Nouveau paiement</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Parrain</TableHead>
                <TableHead>Orphelin/Veuve</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reçu</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paiements.map((paiement: any) => (
                <TableRow key={paiement.id}>
                  <TableCell>
                    {new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {paiement.parrain ? (
                      <Link
                        href={`/parrains/${paiement.parrain.id}`}
                        className="hover:underline"
                      >
                        {paiement.parrain.nom} {paiement.parrain.prenom}
                      </Link>
                    ) : (
                      '-'
                    )}
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
                  <TableCell>
                    {paiement.recu ? (
                      <Link
                        href={`/recus/${paiement.recu.id}`}
                        className="hover:underline"
                      >
                        {paiement.recu.numero}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/paiements/${paiement.id}`}>Voir</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

