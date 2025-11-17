'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ParrainUpdateSchema } from '@/lib/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

export default function EditParrainPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [parrain, setParrain] = useState<any>(null)
  const [orphelins, setOrphelins] = useState<any[]>([])
  const [selectedOrphelins, setSelectedOrphelins] = useState<string[]>([])
  const [closePrevious, setClosePrevious] = useState(false)
  const [orphelinsAvecParrainActif, setOrphelinsAvecParrainActif] = useState<
    string[]
  >([])
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<string>('')

  useEffect(() => {
    Promise.all([
      params.then((p) => {
        setId(p.id)
        return fetch(`/api/parrains/${p.id}`)
      }),
      fetch('/api/orphelins'),
    ])
      .then(([parrainRes, orphelinsRes]) =>
        Promise.all([parrainRes.json(), orphelinsRes.json()])
      )
      .then(([parrainData, orphelinsData]) => {
        setParrain(parrainData)
        setOrphelins(orphelinsData)
        const avecParrainActif = orphelinsData
          .filter((o: any) => o.parrainActuel)
          .map((o: any) => o.id)
        setOrphelinsAvecParrainActif(avecParrainActif)
        form.reset({
          type: parrainData.type,
          nom: parrainData.nom,
          prenom: parrainData.prenom || '',
          cin: parrainData.cin || '',
          ice: parrainData.ice || '',
          email: parrainData.email || '',
          tel: parrainData.tel || '',
          adresse: parrainData.adresse || '',
          valeurKafala: typeof parrainData.valeurKafala === 'object' && 'toNumber' in parrainData.valeurKafala
            ? parrainData.valeurKafala.toNumber()
            : Number(parrainData.valeurKafala) || 0,
          donateurCode: parrainData.donateurCode || '',
          parrainCode: parrainData.parrainCode || '',
          estMembre: parrainData.estMembre,
          estDonateur: parrainData.estDonateur,
          estParrain: parrainData.estParrain,
        })
        setLoading(false)
      })
  }, [params])

  const form = useForm({
    resolver: zodResolver(ParrainUpdateSchema),
    defaultValues: {
      type: 'PERSONNE_PHYSIQUE' as const,
      nom: '',
      prenom: '',
      cin: '',
      ice: '',
      email: '',
      tel: '',
      adresse: '',
      valeurKafala: 0,
      donateurCode: '',
      parrainCode: '',
      estMembre: false,
      estDonateur: true,
      estParrain: true,
    },
  })

  const type = form.watch('type')

  const handleToggleOrphelin = (orphelinId: string) => {
    if (selectedOrphelins.includes(orphelinId)) {
      setSelectedOrphelins(selectedOrphelins.filter((id) => id !== orphelinId))
    } else {
      setSelectedOrphelins([...selectedOrphelins, orphelinId])
    }
  }

  const hasOrphelinsAvecParrainActif = selectedOrphelins.some((id) =>
    orphelinsAvecParrainActif.includes(id)
  )

  async function onSubmit(data: any) {
    try {
      const res = await fetch(`/api/parrains/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          orphelinIds: selectedOrphelins.length > 0 ? selectedOrphelins : undefined,
          closePrevious: hasOrphelinsAvecParrainActif ? closePrevious : undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.erreur || 'Erreur lors de la mise à jour')
      }

      router.push(`/parrains/${id}`)
    } catch (error: any) {
      alert(error.message)
    }
  }

  if (loading) {
    return <div>Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Modifier le parrain</h1>
        <p className="text-muted-foreground mt-2">
          Modifier les informations du parrain
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du parrain</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <FormControl>
                      <select
                        value={String(field.value ?? 'PERSONNE_PHYSIQUE')}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="PERSONNE_PHYSIQUE">Personne physique</option>
                        <option value="SOCIETE">Société</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input
                        value={String(field.value ?? '')}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prenom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input
                        value={String(field.value ?? '')}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {type === 'PERSONNE_PHYSIQUE' ? (
                <FormField
                  control={form.control}
                  name="cin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CIN</FormLabel>
                      <FormControl>
                        <Input
                          value={String(field.value ?? '')}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="ice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ICE</FormLabel>
                      <FormControl>
                        <Input
                          value={String(field.value ?? '')}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        value={String(field.value ?? '')}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input
                        value={String(field.value ?? '')}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adresse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input
                        value={String(field.value ?? '')}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valeurKafala"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valeur Kafala (MAD) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={Number(field.value) || 0}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div>
                  <FormLabel>Assigner des orphelins (optionnel)</FormLabel>
                  <div className="mt-2 max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                    {orphelins.map((orphelin) => {
                      const hasParrainActif = orphelinsAvecParrainActif.includes(
                        orphelin.id
                      )
                      return (
                        <div
                          key={orphelin.id}
                          className="flex items-center gap-3 p-2 rounded border hover:bg-accent cursor-pointer"
                          onClick={() => handleToggleOrphelin(orphelin.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedOrphelins.includes(orphelin.id)}
                            onChange={() => handleToggleOrphelin(orphelin.id)}
                            className="h-4 w-4"
                          />
                          <div className="flex-1">
                            <div className="font-medium">
                              {orphelin.nom} {orphelin.prenom}
                            </div>
                            {hasParrainActif && (
                              <div className="text-sm text-muted-foreground">
                                Parrain actuel:{' '}
                                {orphelin.parrainActuel
                                  ? `${orphelin.parrainActuel.nom} ${orphelin.parrainActuel.prenom}`
                                  : 'Inconnu'}
                              </div>
                            )}
                          </div>
                          {hasParrainActif && (
                            <span className="text-xs text-muted-foreground">
                              Parrain actif
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {hasOrphelinsAvecParrainActif && (
                  <>
                    <Alert variant="destructive">
                      <AlertDescription>
                        Certains orphelins sélectionnés ont déjà un parrain actif.
                      </AlertDescription>
                    </Alert>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="closePrevious"
                        checked={closePrevious}
                        onChange={(e) => setClosePrevious(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <label htmlFor="closePrevious" className="text-sm">
                        Clôturer l'ancien parrainage si nécessaire
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit">Enregistrer</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/parrains/${id}`}>Annuler</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

