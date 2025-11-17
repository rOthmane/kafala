'use client'

import { useEffect, useState } from 'react'
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
import { exportToCSV, exportToXLSX } from '@/lib/export'

export default function OrphelinsPage() {
  const [orphelins, setOrphelins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orphelins')
      .then((res) => res.json())
      .then((data) => {
        setOrphelins(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleExportCSV = () => {
    const exportData = orphelins.map((o) => ({
      Nom: o.nom,
      Prénom: o.prenom || '',
      'Date de naissance': new Date(o.dateNaissance).toLocaleDateString('fr-FR'),
      Âge: o.age,
      Veuve: o.veuve ? `${o.veuve.nom} ${o.veuve.prenom}` : '',
      'Parrain actuel': o.parrainActuel
        ? `${o.parrainActuel.nom} ${o.parrainActuel.prenom}`
        : '',
      Clôturé: o.cloture ? 'Oui' : 'Non',
    }))
    exportToCSV(exportData, 'orphelins')
  }

  const handleExportXLSX = () => {
    const exportData = orphelins.map((o) => ({
      Nom: o.nom,
      Prénom: o.prenom || '',
      'Date de naissance': new Date(o.dateNaissance).toLocaleDateString('fr-FR'),
      Âge: o.age,
      Veuve: o.veuve ? `${o.veuve.nom} ${o.veuve.prenom}` : '',
      'Parrain actuel': o.parrainActuel
        ? `${o.parrainActuel.nom} ${o.parrainActuel.prenom}`
        : '',
      Clôturé: o.cloture ? 'Oui' : 'Non',
    }))
    exportToXLSX(exportData, 'orphelins')
  }

  if (loading) {
    return <div>Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orphelins</h1>
          <p className="text-muted-foreground mt-2">
            Liste de tous les orphelins enregistrés
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            Exporter CSV
          </Button>
          <Button variant="outline" onClick={handleExportXLSX}>
            Exporter XLSX
          </Button>
          <Button asChild>
            <Link href="/orphelins/new">Nouvel orphelin</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des orphelins</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Date Naissance</TableHead>
                <TableHead>Âge</TableHead>
                <TableHead>Veuve</TableHead>
                <TableHead>Parrain actuel</TableHead>
                <TableHead>Alerte 18</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orphelins.map((orphelin: any) => (
                <TableRow key={orphelin.id}>
                  <TableCell className="font-medium">{orphelin.nom}</TableCell>
                  <TableCell>{orphelin.prenom || '-'}</TableCell>
                  <TableCell>
                    {new Date(orphelin.dateNaissance).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>{orphelin.age} ans</TableCell>
                  <TableCell>
                    {orphelin.veuve ? (
                      <Link
                        href={`/veuves/${orphelin.veuve.id}`}
                        className="hover:underline"
                      >
                        {orphelin.veuve.nom} {orphelin.veuve.prenom}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {orphelin.parrainActuel ? (
                      <Link
                        href={`/parrains/${orphelin.parrainActuel.id}`}
                        className="hover:underline"
                      >
                        {orphelin.parrainActuel.nom}{' '}
                        {orphelin.parrainActuel.prenom}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {orphelin.alerte18 ? (
                      <Badge variant="destructive">
                        {orphelin.age >= 18 ? '18 ans' : 'Alerte'}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {orphelin.cloture ? (
                      <Badge variant="secondary">Clôturé</Badge>
                    ) : (
                      <Badge variant="default">Actif</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/orphelins/${orphelin.id}`}>Voir</Link>
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

