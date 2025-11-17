'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ParrainageCreateSchema } from '@/lib/validation'
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
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function NewParrainagePage() {
  const router = useRouter()
  const [parrains, setParrains] = useState<any[]>([])
  const [orphelins, setOrphelins] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/parrains').then((res) => res.json()),
      fetch('/api/orphelins').then((res) => res.json()),
    ]).then(([parrainsData, orphelinsData]) => {
      setParrains(parrainsData)
      setOrphelins(orphelinsData)
    })
  }, [])

  const form = useForm({
    resolver: zodResolver(ParrainageCreateSchema),
    defaultValues: {
      parrainId: '',
      orphelinId: '',
      dateDebut: '',
      dateFin: '',
      valeurKafala: 0,
    },
  })

  const parrainId = form.watch('parrainId')
  const selectedParrain = parrains.find((p) => p.id === parrainId)

  useEffect(() => {
    if (selectedParrain && !form.getValues('valeurKafala')) {
      const valeurKafala = typeof selectedParrain.valeurKafala === 'object' && 'toNumber' in selectedParrain.valeurKafala
        ? selectedParrain.valeurKafala.toNumber()
        : Number(selectedParrain.valeurKafala) || 0
      form.setValue('valeurKafala', valeurKafala)
    }
  }, [selectedParrain, form])

  async function onSubmit(data: any) {
    try {
      const res = await fetch('/api/parrainages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dateDebut: new Date(data.dateDebut),
          dateFin: data.dateFin ? new Date(data.dateFin) : null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.erreur || 'Erreur lors de la création')
      }

      const parrainage = await res.json()
      router.push(`/parrainages/${parrainage.id}`)
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nouveau parrainage</h1>
        <p className="text-muted-foreground mt-2">
          Créer un nouveau parrainage
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du parrainage</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="parrainId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parrain *</FormLabel>
                    <FormControl>
                      <select
                        value={String(field.value ?? '')}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">Sélectionner un parrain</option>
                        {parrains.map((parrain) => (
                          <option key={parrain.id} value={parrain.id}>
                            {parrain.nom} {parrain.prenom} -{' '}
                            {new Intl.NumberFormat('fr-MA', {
                              style: 'currency',
                              currency: 'MAD',
                            }).format(
                              typeof parrain.valeurKafala === 'object' && 'toNumber' in parrain.valeurKafala
                                ? parrain.valeurKafala.toNumber()
                                : Number(parrain.valeurKafala) || 0
                            )}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orphelinId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orphelin *</FormLabel>
                    <FormControl>
                      <select
                        value={String(field.value ?? '')}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">Sélectionner un orphelin</option>
                        {orphelins.map((orphelin) => (
                          <option key={orphelin.id} value={orphelin.id}>
                            {orphelin.nom} {orphelin.prenom}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateDebut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date début *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? String(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value)}
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
                name="dateFin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date fin (optionnel)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? String(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value)}
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

              <div className="flex gap-2">
                <Button type="submit">Créer</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/parrainages">Annuler</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

