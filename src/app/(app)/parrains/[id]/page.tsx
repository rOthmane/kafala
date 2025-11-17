'use client'

import { useState, useEffect } from 'react'
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
import { CalendarGrid } from '@/components/calendar-grid'
import { AssignOrphelinsDialog } from '@/components/assign-orphelins-dialog'

export default function ParrainDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [parrain, setParrain] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<string>('')
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  useEffect(() => {
    params.then((p) => {
      setId(p.id)
      fetch(`/api/parrains/${p.id}`)
        .then((res) => res.json())
        .then((data) => {
          setParrain(data)
          setLoading(false)
        })
    })
  }, [params])

  const handleAssignSuccess = () => {
    // Recharger les données
    fetch(`/api/parrains/${id}`)
      .then((res) => res.json())
      .then((data) => setParrain(data))
  }

  if (loading || !parrain) {
    return <div>Chargement...</div>
  }

  // Collecter toutes les échéances de tous les parrainages
  const allEcheances = parrain.parrainages.flatMap((p: any) =>
    p.echeances.map((e: any) => ({
      ...e,
      parrainageId: p.id,
    }))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {parrain.nom} {parrain.prenom}
          </h1>
          <p className="text-muted-foreground mt-2">Détails du parrain</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/parrains">Retour</Link>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setAssignDialogOpen(true)}
          >
            Assigner des orphelins
          </Button>
          <Button asChild>
            <Link href={`/parrains/${parrain.id}/edit`}>Modifier</Link>
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
              <span className="text-sm font-medium">Type:</span>{' '}
              <Badge variant="secondary">
                {parrain.type === 'PERSONNE_PHYSIQUE'
                  ? 'Personne physique'
                  : 'Société'}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium">Nom:</span>{' '}
              <span>{parrain.nom}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Prénom:</span>{' '}
              <span>{parrain.prenom || '-'}</span>
            </div>
            {parrain.type === 'PERSONNE_PHYSIQUE' ? (
              <div>
                <span className="text-sm font-medium">CIN:</span>{' '}
                <span>{parrain.cin || '-'}</span>
              </div>
            ) : (
              <div>
                <span className="text-sm font-medium">ICE:</span>{' '}
                <span>{parrain.ice || '-'}</span>
              </div>
            )}
            <div>
              <span className="text-sm font-medium">Email:</span>{' '}
              <span>{parrain.email || '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Téléphone:</span>{' '}
              <span>{parrain.tel || '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Adresse:</span>{' '}
              <span>{parrain.adresse || '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Valeur Kafala:</span>{' '}
              <span>
                {new Intl.NumberFormat('fr-MA', {
                  style: 'currency',
                  currency: 'MAD',
                }).format(
                  typeof parrain.valeurKafala === 'object'
                    ? parrain.valeurKafala.toNumber()
                    : parrain.valeurKafala
                )}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Nombre de parrainages actifs:</span>{' '}
              <span>{parrain.nombreParrainages || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">Nombre de parrainages:</span>{' '}
              <span>{parrain.parrainages.length}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Nombre de reçus:</span>{' '}
              <span>{parrain.recus.length}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Nombre de virements:</span>{' '}
              <span>{parrain.virements.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendrier des paiements (12 mois)</CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarGrid echeances={allEcheances} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Historique des parrainages ({parrain.parrainages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orphelin</TableHead>
                <TableHead>Date début</TableHead>
                <TableHead>Date fin</TableHead>
                <TableHead>Valeur Kafala</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Échéances</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parrain.parrainages.map((parrainage: any) => {
                const active = !parrainage.dateFin
                return (
                  <TableRow key={parrainage.id}>
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

      <AssignOrphelinsDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        parrainId={id}
        valeurKafala={parrain.valeurKafala}
        onSuccess={handleAssignSuccess}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Paiements ({parrain.paiements?.length || 0})</CardTitle>
            <Button asChild>
              <Link
                href={`/paiements/new?parrainId=${parrain.id}&type=KAFALA`}
              >
                Nouveau paiement Kafala
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {parrain.paiements && parrain.paiements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Allocation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parrain.paiements.map((paiement: any) => (
                  <TableRow key={paiement.id}>
                    <TableCell>
                      <Link
                        href={`/paiements/${paiement.id}`}
                        className="hover:underline"
                      >
                        {new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('fr-MA', {
                        style: 'currency',
                        currency: 'MAD',
                      }).format(paiement.montant)}
                    </TableCell>
                    <TableCell>{paiement.type}</TableCell>
                    <TableCell>
                      {paiement.allocation && Array.isArray(paiement.allocation) ? (
                        <span className="text-sm text-muted-foreground">
                          {paiement.allocation.length} échéances
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">
              Aucun paiement enregistré. Le montant sera réparti automatiquement entre tous les
              orphelins parrainés lors de la création d'un paiement Kafala.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reçus ({parrain.recus.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Date émission</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parrain.recus.map((recu: any) => (
                <TableRow key={recu.id}>
                  <TableCell>
                    <Link
                      href={`/recus/${recu.id}`}
                      className="hover:underline font-medium"
                    >
                      {recu.numero}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {new Date(recu.dateEmission).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('fr-MA', {
                      style: 'currency',
                      currency: 'MAD',
                    }).format(recu.total)}
                  </TableCell>
                  <TableCell>{recu.type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

