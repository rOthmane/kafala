'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart } from '@/components/charts/bar-chart'
import { LineChart } from '@/components/charts/line-chart'
import { DonutChart } from '@/components/charts/donut-chart'
import { AreaChart } from '@/components/charts/area-chart'

interface DashboardChartsProps {
  echeancesPrevuesParMois: Array<{ mois: string; montant: number }>
  echeancesEncaisseesParMois: Array<{ mois: string; montant: number }>
  parrainsActifsVsInactifs: { actifs: number; inactifs: number }
  distributionAges: Array<{ tranche: string; nombre: number }>
  topParrains: Array<{ parrainId: string; nom: string; prenom: string; montantTotal: number }>
  evolutionPaiements: Array<{ mois: string; montant: number }>
  echeancesEnRetardParMois: Array<{ mois: string; nombre: number }>
}

export function DashboardCharts({
  echeancesPrevuesParMois,
  echeancesEncaisseesParMois,
  parrainsActifsVsInactifs,
  distributionAges,
  topParrains,
  evolutionPaiements,
  echeancesEnRetardParMois,
}: DashboardChartsProps) {
  // Préparer les données pour le graphique comparatif échéances prévues/encaissées
  // Utiliser seulement les 12 derniers mois où on a des données encaissées
  const comparaisonEcheances = echeancesEncaisseesParMois.map((encaisse) => {
    const prevu = echeancesPrevuesParMois.find((p) => p.mois === encaisse.mois)
    return {
      mois: encaisse.mois,
      prévu: prevu?.montant || 0,
      encaissé: encaisse.montant,
    }
  })

  // Préparer les données pour le donut parrains actifs/inactifs
  const parrainsData = [
    { name: 'Actifs', value: parrainsActifsVsInactifs.actifs },
    { name: 'Inactifs', value: parrainsActifsVsInactifs.inactifs },
  ]

  // Préparer les données pour le donut distribution des âges
  const agesData = distributionAges.map((d) => ({
    name: `${d.tranche} ans`,
    value: d.nombre,
  }))

  // Préparer les données pour le top 5 parrains
  const topParrainsData = topParrains.map((p) => ({
    nom: `${p.nom} ${p.prenom}`,
    montant: p.montantTotal,
  }))

  // Calculer le taux de recouvrement par mois
  const tauxRecouvrementParMois = echeancesEncaisseesParMois.map((encaisse) => {
    const prevu = echeancesPrevuesParMois.find((p) => p.mois === encaisse.mois)
    const montantPrevu = prevu?.montant || 0
    const taux = montantPrevu > 0 ? (encaisse.montant / montantPrevu) * 100 : 0
    return {
      mois: encaisse.mois,
      taux: Math.round(taux * 10) / 10, // Arrondir à 1 décimale
    }
  })

  return (
    <div className="space-y-6">
      {/* Échéances prévues vs encaissées */}
      <Card>
        <CardHeader>
          <CardTitle>Échéances prévues vs montants alloués (12 derniers mois)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Les montants alloués reflètent l'affectation réelle des paiements sur les échéances selon la logique FIFO.
          </p>
          <BarChart
            data={comparaisonEcheances}
            dataKeys={[
              { key: 'prévu', name: 'Prévu', color: '#8884d8' },
              { key: 'encaissé', name: 'Montant alloué', color: '#82ca9d' },
            ]}
            xAxisKey="mois"
            height={350}
          />
        </CardContent>
      </Card>

      {/* Taux de recouvrement par mois */}
      <Card>
        <CardHeader>
          <CardTitle>Taux de recouvrement par mois (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={tauxRecouvrementParMois}
            dataKeys={[{ key: 'taux', name: 'Taux de recouvrement (%)', color: '#8884d8' }]}
            xAxisKey="mois"
            height={300}
            tooltipFormatter={(value: number) => `${value.toFixed(1)}%`}
          />
        </CardContent>
      </Card>

      {/* Évolution mensuelle des montants alloués */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution mensuelle des montants alloués aux échéances</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={evolutionPaiements}
            dataKeys={[{ key: 'montant', name: 'Montant alloué', color: '#8884d8' }]}
            xAxisKey="mois"
            height={300}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Parrains actifs vs inactifs */}
        <Card>
          <CardHeader>
            <CardTitle>Parrains actifs vs inactifs</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={parrainsData} height={300} />
          </CardContent>
        </Card>

        {/* Distribution des orphelins par tranche d'âge */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution des orphelins par tranche d'âge</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={agesData} height={300} />
          </CardContent>
        </Card>
      </div>

      {/* Top 5 parrains */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 parrains par montant total versé (12 derniers mois)</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={topParrainsData}
            dataKeys={[{ key: 'montant', name: 'Montant total', color: '#8884d8' }]}
            xAxisKey="nom"
            height={300}
          />
        </CardContent>
      </Card>

      {/* Échéances en retard par mois */}
      <Card>
        <CardHeader>
          <CardTitle>Échéances en retard par mois</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaChart
            data={echeancesEnRetardParMois}
            dataKey="nombre"
            xAxisKey="mois"
            color="#ff7300"
            height={300}
          />
        </CardContent>
      </Card>
    </div>
  )
}

