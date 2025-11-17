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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { exportToCSV, exportToXLSX } from '@/lib/export'

export default function VirementsPage() {
  const [virements, setVirements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/virements')
      .then((res) => res.json())
      .then((data) => {
        setVirements(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleExportCSV = () => {
    const exportData = virements.map((v) => ({
      Orphelin: v.orphelin ? `${v.orphelin.nom} ${v.orphelin.prenom}` : '',
      'Veuve (RIB)': v.veuve ? `${v.veuve.nom} ${v.veuve.prenom} (${v.veuve.rib || ''})` : '',
      Parrain: v.parrain ? `${v.parrain.nom} ${v.parrain.prenom}` : '',
      'Valeur Kafala': v.valeurKafala,
      'Nombre de mois': v.nbMois,
      'Date virement': new Date(v.dateVirement).toLocaleDateString('fr-FR'),
    }))
    exportToCSV(exportData, 'virements')
  }

  const handleExportXLSX = () => {
    const exportData = virements.map((v) => ({
      Orphelin: v.orphelin ? `${v.orphelin.nom} ${v.orphelin.prenom}` : '',
      'Veuve (RIB)': v.veuve ? `${v.veuve.nom} ${v.veuve.prenom} (${v.veuve.rib || ''})` : '',
      Parrain: v.parrain ? `${v.parrain.nom} ${v.parrain.prenom}` : '',
      'Valeur Kafala': v.valeurKafala,
      'Nombre de mois': v.nbMois,
      'Date virement': new Date(v.dateVirement).toLocaleDateString('fr-FR'),
    }))
    exportToXLSX(exportData, 'virements')
  }

  if (loading) {
    return <div>Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Virements</h1>
          <p className="text-muted-foreground mt-2">
            Liste de tous les virements enregistrés
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
            <Link href="/virements/new">Nouveau virement</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des virements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orphelin</TableHead>
                <TableHead>Veuve (RIB)</TableHead>
                <TableHead>Parrain</TableHead>
                <TableHead>Valeur Kafala</TableHead>
                <TableHead>Nombre de mois</TableHead>
                <TableHead>Date virement</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {virements.map((virement: any) => (
                <TableRow key={virement.id}>
                  <TableCell>
                    {virement.orphelin ? (
                      <Link
                        href={`/orphelins/${virement.orphelin.id}`}
                        className="hover:underline"
                      >
                        {virement.orphelin.nom} {virement.orphelin.prenom}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {virement.veuve ? (
                      <div>
                        <Link
                          href={`/veuves/${virement.veuve.id}`}
                          className="hover:underline"
                        >
                          {virement.veuve.nom} {virement.veuve.prenom}
                        </Link>
                        {virement.veuve.rib && (
                          <div className="text-sm text-muted-foreground">
                            RIB: {virement.veuve.rib}
                          </div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {virement.parrain ? (
                      <Link
                        href={`/parrains/${virement.parrain.id}`}
                        className="hover:underline"
                      >
                        {virement.parrain.nom} {virement.parrain.prenom}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('fr-MA', {
                      style: 'currency',
                      currency: 'MAD',
                    }).format(virement.valeurKafala)}
                  </TableCell>
                  <TableCell>{virement.nbMois}</TableCell>
                  <TableCell>
                    {new Date(virement.dateVirement).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/virements/${virement.id}`}>Voir</Link>
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

