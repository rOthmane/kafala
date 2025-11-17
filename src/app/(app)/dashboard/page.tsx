import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardCharts } from '@/components/dashboard-charts'

async function getDashboardData() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window === 'undefined' ? 'http://localhost:3000' : '')
  const res = await fetch(`${baseUrl}/api/dashboard`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error('Erreur lors du chargement des données')
  }
  return res.json()
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble du système de gestion Kafala
        </p>
      </div>

      {/* KPIs principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Parrains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.nombreParrains}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Orphelins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.nombreOrphelins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Veuves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.nombreVeuves}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Kafala du mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-MA', {
                style: 'currency',
                currency: 'MAD',
              }).format(data.montantKafalaMois)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Alertes 18 ans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{data.alertes18}</div>
              {data.alertes18 > 0 && <Badge variant="destructive">Attention</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nouveaux KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Parrains en retard (&gt; 6 mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{data.parrainsEnRetard || 0}</div>
              {data.parrainsEnRetard > 0 && <Badge variant="destructive">Urgent</Badge>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Taux de recouvrement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {data.tauxRecouvrement?.toFixed(1) || 0}%
              </div>
              {data.tauxRecouvrement >= 80 ? (
                <Badge variant="default" className="bg-green-500">
                  Bon
                </Badge>
              ) : data.tauxRecouvrement >= 60 ? (
                <Badge variant="default" className="bg-yellow-500">
                  Moyen
                </Badge>
              ) : (
                <Badge variant="destructive">Faible</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Kafala prévu ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-MA', {
                style: 'currency',
                currency: 'MAD',
              }).format(data.montantKafalaPrevuMois || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Encaissé:{' '}
              {new Intl.NumberFormat('fr-MA', {
                style: 'currency',
                currency: 'MAD',
              }).format(data.montantKafalaMois || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Taux de paiement mensuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {data.tauxPaiementMensuel?.toFixed(1) || 0}%
              </div>
              {data.tauxPaiementMensuel >= 80 ? (
                <Badge variant="default" className="bg-green-500">
                  Excellent
                </Badge>
              ) : data.tauxPaiementMensuel >= 60 ? (
                <Badge variant="default" className="bg-yellow-500">
                  Correct
                </Badge>
              ) : (
                <Badge variant="destructive">À améliorer</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs supplémentaires */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Parrains actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.parrainsActifsVsInactifs?.actifs || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Inactifs: {data.parrainsActifsVsInactifs?.inactifs || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Montant moyen par parrain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-MA', {
                style: 'currency',
                currency: 'MAD',
              }).format(data.montantMoyenParParrain || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total orphelins par âge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.distributionAges?.map((d: { tranche: string; nombre: number }) => (
                <div key={d.tranche} className="flex justify-between text-sm">
                  <span>{d.tranche} ans:</span>
                  <span className="font-medium">{d.nombre}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <DashboardCharts
        echeancesPrevuesParMois={data.echeancesPrevuesParMois || []}
        echeancesEncaisseesParMois={data.echeancesEncaisseesParMois || []}
        parrainsActifsVsInactifs={data.parrainsActifsVsInactifs || { actifs: 0, inactifs: 0 }}
        distributionAges={data.distributionAges || []}
        topParrains={data.topParrains || []}
        evolutionPaiements={data.evolutionPaiements || []}
        echeancesEnRetardParMois={data.echeancesEnRetardParMois || []}
      />
    </div>
  )
}
