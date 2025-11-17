import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

async function getParrainage(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (typeof window === 'undefined' ? 'http://localhost:3000' : '')
  const res = await fetch(`${baseUrl}/api/parrainages/${id}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Parrainage non trouvé')
    }
    throw new Error('Erreur lors de la récupération du parrainage')
  }
  return res.json()
}

export default async function ParrainageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const parrainage = await getParrainage(id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parrainage</h1>
          <p className="text-muted-foreground mt-2">Détails du parrainage</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/parrainages">Retour</Link>
          </Button>
          <Button asChild>
            <Link href={`/parrainages/${parrainage.id}/edit`}>Modifier</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Parrain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Link
                href={`/parrains/${parrainage.parrain.id}`}
                className="text-lg font-medium hover:underline"
              >
                {parrainage.parrain.nom} {parrainage.parrain.prenom}
              </Link>
            </div>
            <div>
              <span className="text-sm font-medium">Valeur Kafala:</span>{' '}
              <span>
                {new Intl.NumberFormat('fr-MA', {
                  style: 'currency',
                  currency: 'MAD',
                }).format(parrainage.parrain.valeurKafala)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orphelin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Link
                href={`/orphelins/${parrainage.orphelin.id}`}
                className="text-lg font-medium hover:underline"
              >
                {parrainage.orphelin.nom} {parrainage.orphelin.prenom}
              </Link>
            </div>
            <div>
              <span className="text-sm font-medium">Date de naissance:</span>{' '}
              <span>
                {new Date(parrainage.orphelin.dateNaissance).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du parrainage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm font-medium">Date début:</span>{' '}
            <span>
              {new Date(parrainage.dateDebut).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium">Date fin:</span>{' '}
            <span>
              {parrainage.dateFin
                ? new Date(parrainage.dateFin).toLocaleDateString('fr-FR')
                : 'En cours'}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium">Valeur Kafala:</span>{' '}
            <span>
              {new Intl.NumberFormat('fr-MA', {
                style: 'currency',
                currency: 'MAD',
              }).format(parrainage.valeurKafala)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Échéances ({parrainage.echeances.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mois</TableHead>
                <TableHead>Montant dû</TableHead>
                <TableHead>Montant payé</TableHead>
                <TableHead>Reste</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parrainage.echeances.map((echeance: any) => (
                <TableRow key={echeance.id}>
                  <TableCell>
                    {new Date(echeance.mois).toLocaleDateString('fr-FR', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('fr-MA', {
                      style: 'currency',
                      currency: 'MAD',
                    }).format(echeance.montantDu)}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('fr-MA', {
                      style: 'currency',
                      currency: 'MAD',
                    }).format(echeance.montantPaye)}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('fr-MA', {
                      style: 'currency',
                      currency: 'MAD',
                    }).format(echeance.montantDu - echeance.montantPaye)}
                  </TableCell>
                  <TableCell>
                    {echeance.soldée ? (
                      <Badge variant="default" className="bg-green-500">
                        Soldée
                      </Badge>
                    ) : echeance.montantPaye > 0 ? (
                      <Badge variant="secondary">Partiel</Badge>
                    ) : (
                      <Badge variant="destructive">Non payée</Badge>
                    )}
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

