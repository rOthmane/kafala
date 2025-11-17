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

async function getRecus() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (typeof window === 'undefined' ? 'http://localhost:3000' : '')
  const res = await fetch(`${baseUrl}/api/recus`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error('Erreur lors du chargement des reçus')
  }
  return res.json()
}

export default async function RecusPage() {
  const recus = await getRecus()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reçus</h1>
          <p className="text-muted-foreground mt-2">
            Liste de tous les reçus générés
          </p>
        </div>
        <Button asChild>
          <Link href="/recus/new">Nouveau reçu</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des reçus</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Parrain</TableHead>
                <TableHead>ICE</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date émission</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recus.map((recu: any) => (
                <TableRow key={recu.id}>
                  <TableCell className="font-medium">{recu.numero}</TableCell>
                  <TableCell>
                    {recu.parrain ? (
                      <Link
                        href={`/parrains/${recu.parrain.id}`}
                        className="hover:underline"
                      >
                        {recu.parrain.nom} {recu.parrain.prenom}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{recu.ice || '-'}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('fr-MA', {
                      style: 'currency',
                      currency: 'MAD',
                    }).format(recu.total)}
                  </TableCell>
                  <TableCell>{recu.type}</TableCell>
                  <TableCell>
                    {new Date(recu.dateEmission).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/recus/${recu.id}`}>Voir</Link>
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

