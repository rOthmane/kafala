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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

async function getVeuves() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (typeof window === 'undefined' ? 'http://localhost:3000' : '')
  const res = await fetch(`${baseUrl}/api/veuves`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error('Erreur lors du chargement des veuves')
  }
  return res.json()
}

export default async function VeuvesPage() {
  const veuves = await getVeuves()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Veuves</h1>
          <p className="text-muted-foreground mt-2">
            Liste de toutes les veuves enregistrées
          </p>
        </div>
        <Button asChild>
          <Link href="/veuves/new">Nouvelle veuve</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des veuves</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>CIN</TableHead>
                <TableHead>RIB</TableHead>
                <TableHead>Tél</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Nb Orphelins</TableHead>
                <TableHead>Total Paiements</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {veuves.map((veuve: any) => (
                <TableRow key={veuve.id}>
                  <TableCell className="font-medium">{veuve.nom}</TableCell>
                  <TableCell>{veuve.prenom || '-'}</TableCell>
                  <TableCell>{veuve.cin || '-'}</TableCell>
                  <TableCell>{veuve.rib || '-'}</TableCell>
                  <TableCell>{veuve.tel || '-'}</TableCell>
                  <TableCell>{veuve.adresse || '-'}</TableCell>
                  <TableCell>{veuve.nombreOrphelins}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('fr-MA', {
                      style: 'currency',
                      currency: 'MAD',
                    }).format(veuve.totalPaiements)}
                  </TableCell>
                  <TableCell>
                    {veuve.cloturee ? (
                      <Badge variant="secondary">Clôturée</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/veuves/${veuve.id}`}>Voir</Link>
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

