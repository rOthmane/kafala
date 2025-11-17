import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

async function getVirement(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (typeof window === 'undefined' ? 'http://localhost:3000' : '')
  const res = await fetch(`${baseUrl}/api/virements/${id}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Virement non trouvé')
    }
    throw new Error('Erreur lors de la récupération du virement')
  }
  return res.json()
}

export default async function VirementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const virement = await getVirement(id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Virement</h1>
          <p className="text-muted-foreground mt-2">Détails du virement</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/virements">Retour</Link>
          </Button>
          <Button asChild>
            <Link href={`/virements/${virement.id}/edit`}>Modifier</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Orphelin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Link
                href={`/orphelins/${virement.orphelin.id}`}
                className="text-lg font-medium hover:underline"
              >
                {virement.orphelin.nom} {virement.orphelin.prenom}
              </Link>
            </div>
            <div>
              <span className="text-sm font-medium">Date de naissance:</span>{' '}
              <span>
                {new Date(virement.orphelin.dateNaissance).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Veuve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Link
                href={`/veuves/${virement.veuve.id}`}
                className="text-lg font-medium hover:underline"
              >
                {virement.veuve.nom} {virement.veuve.prenom}
              </Link>
            </div>
            <div>
              <span className="text-sm font-medium">RIB:</span>{' '}
              <span>{virement.veuve.rib || '-'}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Téléphone:</span>{' '}
              <span>{virement.veuve.tel || '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parrain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Link
                href={`/parrains/${virement.parrain.id}`}
                className="text-lg font-medium hover:underline"
              >
                {virement.parrain.nom} {virement.parrain.prenom}
              </Link>
            </div>
            <div>
              <span className="text-sm font-medium">Valeur Kafala:</span>{' '}
              <span>
                {new Intl.NumberFormat('fr-MA', {
                  style: 'currency',
                  currency: 'MAD',
                }).format(virement.parrain.valeurKafala)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du virement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm font-medium">Valeur Kafala:</span>{' '}
            <span className="font-medium">
              {new Intl.NumberFormat('fr-MA', {
                style: 'currency',
                currency: 'MAD',
              }).format(virement.valeurKafala)}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium">Nombre de mois:</span>{' '}
            <span className="font-medium">{virement.nbMois}</span>
          </div>
          <div>
            <span className="text-sm font-medium">Date du virement:</span>{' '}
            <span>
              {new Date(virement.dateVirement).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium">Montant total:</span>{' '}
            <span className="font-medium">
              {new Intl.NumberFormat('fr-MA', {
                style: 'currency',
                currency: 'MAD',
              }).format(virement.valeurKafala * virement.nbMois)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

