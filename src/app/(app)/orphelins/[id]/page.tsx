import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

async function getOrphelin(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (typeof window === 'undefined' ? 'http://localhost:3000' : '')
  const res = await fetch(`${baseUrl}/api/orphelins/${id}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Orphelin non trouvé')
    }
    throw new Error('Erreur lors de la récupération de l\'orphelin')
  }
  return res.json()
}

export default async function OrphelinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const orphelin = await getOrphelin(id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {orphelin.nom} {orphelin.prenom}
          </h1>
          <p className="text-muted-foreground mt-2">Détails de l'orphelin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/orphelins">Retour</Link>
          </Button>
          <Button asChild>
            <Link href={`/orphelins/${orphelin.id}/edit`}>Modifier</Link>
          </Button>
        </div>
      </div>

      {orphelin.alerte18 && (
        <Alert className="border-destructive bg-destructive/10">
          <div className="flex items-center gap-2">
            <Badge variant="destructive">
              {orphelin.age >= 18 ? '18 ans atteint' : 'Alerte 18 ans'}
            </Badge>
            <span>
              L'orphelin a {orphelin.age} ans. Action requise avant l'âge de 18
              ans.
            </span>
          </div>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">Nom:</span>{' '}
              <span>{orphelin.nom}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Prénom:</span>{' '}
              <span>{orphelin.prenom || '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Date de naissance:</span>{' '}
              <span>
                {new Date(orphelin.dateNaissance).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Âge:</span>{' '}
              <span>{orphelin.age} ans</span>
            </div>
            <div>
              <span className="text-sm font-medium">Statut:</span>{' '}
              {orphelin.cloture ? (
                <Badge variant="secondary">Clôturé</Badge>
              ) : (
                <Badge variant="default">Actif</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Veuve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">Nom:</span>{' '}
              <Link
                href={`/veuves/${orphelin.veuve.id}`}
                className="hover:underline"
              >
                {orphelin.veuve.nom} {orphelin.veuve.prenom}
              </Link>
            </div>
            <div>
              <span className="text-sm font-medium">RIB:</span>{' '}
              <span>{orphelin.veuve.rib || '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Téléphone:</span>{' '}
              <span>{orphelin.veuve.tel || '-'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {orphelin.parrainages.some((p: any) => !p.dateFin) && (
        <Card>
          <CardHeader>
            <CardTitle>Parrain actuel</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const parrainActuel = orphelin.parrainages.find((p: any) => !p.dateFin)
              if (!parrainActuel) return null
              return (
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Parrain:</span>{' '}
                    <Link
                      href={`/parrains/${parrainActuel.parrain.id}`}
                      className="hover:underline font-medium"
                    >
                      {parrainActuel.parrain.nom} {parrainActuel.parrain.prenom}
                    </Link>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Date début:</span>{' '}
                    <span>
                      {new Date(parrainActuel.dateDebut).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Valeur Kafala:</span>{' '}
                    <span>
                      {new Intl.NumberFormat('fr-MA', {
                        style: 'currency',
                        currency: 'MAD',
                      }).format(parrainActuel.valeurKafala)}
                    </span>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historique des parrains</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parrain</TableHead>
                <TableHead>Date début</TableHead>
                <TableHead>Date fin</TableHead>
                <TableHead>Valeur Kafala</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Échéances</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orphelin.parrainages.map((parrainage: any) => {
                const active = !parrainage.dateFin
                return (
                  <TableRow key={parrainage.id}>
                    <TableCell>
                      <Link
                        href={`/parrains/${parrainage.parrain.id}`}
                        className="hover:underline"
                      >
                        {parrainage.parrain.nom} {parrainage.parrain.prenom}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {new Date(parrainage.dateDebut).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      {parrainage.dateFin
                        ? new Date(parrainage.dateFin).toLocaleDateString('fr-FR')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('fr-MA', {
                        style: 'currency',
                        currency: 'MAD',
                      }).format(parrainage.valeurKafala)}
                    </TableCell>
                    <TableCell>
                      {active ? (
                        <Badge variant="default">Actif</Badge>
                      ) : (
                        <Badge variant="secondary">Clôturé</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/parrainages/${parrainage.id}`}
                        className="hover:underline"
                      >
                        {parrainage.echeances.length} échéances
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Parrain</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reçu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orphelin.paiements.map((paiement: any) => (
                <TableRow key={paiement.id}>
                  <TableCell>
                    {new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {paiement.parrain
                      ? `${paiement.parrain.nom} ${paiement.parrain.prenom}`
                      : '-'}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

