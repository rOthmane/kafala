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

async function getParrains() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (typeof window === 'undefined' ? 'http://localhost:3000' : '')
  const res = await fetch(`${baseUrl}/api/parrains`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error('Erreur lors du chargement des parrains')
  }
  return res.json()
}

export default async function ParrainsPage() {
  const parrains = await getParrains()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parrains</h1>
          <p className="text-muted-foreground mt-2">
            Liste de tous les parrains enregistrés
          </p>
        </div>
        <Button asChild>
          <Link href="/parrains/new">Nouveau parrain</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des parrains</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>CIN/ICE</TableHead>
                <TableHead>Valeur Kafala</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tél</TableHead>
                <TableHead>Nb Parrainages</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parrains.map((parrain: any) => (
                <TableRow key={parrain.id}>
                  <TableCell className="font-medium">{parrain.nom}</TableCell>
                  <TableCell>{parrain.prenom || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {parrain.type === 'PERSONNE_PHYSIQUE'
                        ? 'Personne physique'
                        : 'Société'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {parrain.type === 'SOCIETE' ? parrain.ice : parrain.cin || '-'}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('fr-MA', {
                      style: 'currency',
                      currency: 'MAD',
                    }).format(parrain.valeurKafala)}
                  </TableCell>
                  <TableCell>{parrain.email || '-'}</TableCell>
                  <TableCell>{parrain.tel || '-'}</TableCell>
                  <TableCell>{parrain.nombreParrainages}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/parrains/${parrain.id}`}>Voir</Link>
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

