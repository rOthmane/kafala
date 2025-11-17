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

async function getParrainages() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (typeof window === 'undefined' ? 'http://localhost:3000' : '')
  const res = await fetch(`${baseUrl}/api/parrainages`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error('Erreur lors du chargement des parrainages')
  }
  return res.json()
}

export default async function ParrainagesPage() {
  const parrainages = await getParrainages()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parrainages</h1>
          <p className="text-muted-foreground mt-2">
            Liste de tous les parrainages enregistrés
          </p>
        </div>
        <Button asChild>
          <Link href="/parrainages/new">Nouveau parrainage</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des parrainages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parrain</TableHead>
                <TableHead>Orphelin</TableHead>
                <TableHead>Date début</TableHead>
                <TableHead>Date fin</TableHead>
                <TableHead>Valeur Kafala</TableHead>
                <TableHead>Échéances</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parrainages.map((parrainage: any) => (
                <TableRow key={parrainage.id}>
                  <TableCell>
                    <Link
                      href={`/parrains/${parrainage.parrain.id}`}
                      className="hover:underline font-medium"
                    >
                      {parrainage.parrain.nom} {parrainage.parrain.prenom}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/orphelins/${parrainage.orphelin.id}`}
                      className="hover:underline"
                    >
                      {parrainage.orphelin.nom} {parrainage.orphelin.prenom}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {new Date(parrainage.dateDebut).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {parrainage.dateFin
                      ? new Date(parrainage.dateFin).toLocaleDateString('fr-FR')
                      : 'En cours'}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('fr-MA', {
                      style: 'currency',
                      currency: 'MAD',
                    }).format(parrainage.valeurKafala)}
                  </TableCell>
                  <TableCell>
                    {parrainage.statsEcheances.total} total ({parrainage.statsEcheances.soldees} soldées)
                  </TableCell>
                  <TableCell>
                    {parrainage.dateFin ? 'Terminé' : 'Actif'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/parrainages/${parrainage.id}`}>Voir</Link>
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

