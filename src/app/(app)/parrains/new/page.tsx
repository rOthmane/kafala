'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ParrainCreateSchema } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function NewParrainPage() {
  const router = useRouter()
  const [orphelins, setOrphelins] = useState<any[]>([])
  const [selectedOrphelins, setSelectedOrphelins] = useState<string[]>([])
  const [closePrevious, setClosePrevious] = useState(false)
  const [orphelinsAvecParrainActif, setOrphelinsAvecParrainActif] = useState<
    string[]
  >([])

  useEffect(() => {
    fetch('/api/orphelins')
      .then((res) => res.json())
      .then((data) => {
        setOrphelins(data)
        const avecParrainActif = data
          .filter((o: any) => o.parrainActuel)
          .map((o: any) => o.id)
        setOrphelinsAvecParrainActif(avecParrainActif)
      })
  }, [])

  const form = useForm({
    resolver: zodResolver(ParrainCreateSchema),
    defaultValues: {
      type: 'PERSONNE_PHYSIQUE',
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
      const res = await fetch('/api/parrains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          orphelinIds: selectedOrphelins.length > 0 ? selectedOrphelins : undefined,
          closePrevious: hasOrphelinsAvecParrainActif ? closePrevious : undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.erreur || 'Erreur lors de la création')
      }

      const parrain = await res.json()
      router.push(`/parrains/${parrain.id}`)
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nouveau parrain</h1>
        <p className="text-muted-foreground mt-2">
          Créer un nouveau profil de parrain
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
                        {...field}
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
                      <Input {...field} />
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
                      <Input {...field} />
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
                        <Input {...field} />
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
                        <Input {...field} />
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
                      <Input type="email" {...field} />
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
                      <Input {...field} />
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
                      <Input {...field} />
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
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                <Button type="submit">Créer</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/parrains">Annuler</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

