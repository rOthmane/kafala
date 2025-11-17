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

async function getVeuve(id: string) {
  // For server components, use absolute URL with localhost fallback
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/veuves/${id}`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Veuve non trouvée')
    }
    throw new Error('Erreur lors de la récupération de la veuve')
  }
  return res.json()
}

export default async function VeuveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const veuve = await getVeuve(id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {veuve.nom} {veuve.prenom}
          </h1>
          <p className="text-muted-foreground mt-2">Détails de la veuve</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/veuves">Retour</Link>
          </Button>
          <Button asChild>
            <Link href={`/veuves/${veuve.id}/edit`}>Modifier</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">Nom:</span>{' '}
              <span>{veuve.nom}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Prénom:</span>{' '}
              <span>{veuve.prenom || '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium">CIN:</span>{' '}
              <span>{veuve.cin || '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium">RIB:</span>{' '}
              <span>{veuve.rib || '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Téléphone:</span>{' '}
              <span>{veuve.tel || '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Adresse:</span>{' '}
              <span>{veuve.adresse || '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Statut:</span>{' '}
              {veuve.cloturee ? (
                <Badge variant="secondary">Clôturée</Badge>
              ) : (
                <Badge variant="default">Active</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orphelins ({veuve.orphelins.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {veuve.orphelins.length > 0 ? (
              <div className="space-y-2">
                {veuve.orphelins.map((orphelin: any) => (
                  <div
                    key={orphelin.id}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div>
                      <Link
                        href={`/orphelins/${orphelin.id}`}
                        className="font-medium hover:underline"
                      >
                        {orphelin.nom} {orphelin.prenom}
                      </Link>
                      {orphelin.parrainages[0] && (
                        <div className="text-sm text-muted-foreground">
                          Parrain: {orphelin.parrainages[0].parrain.nom}{' '}
                          {orphelin.parrainages[0].parrain.prenom}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucun orphelin</p>
            )}
          </CardContent>
        </Card>
      </div>

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
              {veuve.paiements.map((paiement: any) => (
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

      <Card>
        <CardHeader>
          <CardTitle>Virements ({veuve.virements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Orphelin</TableHead>
                <TableHead>Parrain</TableHead>
                <TableHead>Valeur Kafala</TableHead>
                <TableHead>Nb Mois</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {veuve.virements.map((virement: any) => (
                <TableRow key={virement.id}>
                  <TableCell>
                    {new Date(virement.dateVirement).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/orphelins/${virement.orphelin.id}`}
                      className="hover:underline"
                    >
                      {virement.orphelin.nom} {virement.orphelin.prenom}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/parrains/${virement.parrain.id}`}
                      className="hover:underline"
                    >
                      {virement.parrain.nom} {virement.parrain.prenom}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('fr-MA', {
                      style: 'currency',
                      currency: 'MAD',
                    }).format(virement.valeurKafala)}
                  </TableCell>
                  <TableCell>{virement.nbMois}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

