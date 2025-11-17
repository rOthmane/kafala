'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RecuCreateSchema } from '@/lib/validation'
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

export default function NewRecuPage() {
  const router = useRouter()
  const [parrains, setParrains] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/parrains')
      .then((res) => res.json())
      .then((data) => setParrains(data))
  }, [])

  const form = useForm({
    resolver: zodResolver(RecuCreateSchema),
    defaultValues: {
      numero: '',
      parrainId: '',
      ice: '',
      total: 0,
      type: 'KAFALA',
      dateEmission: new Date().toISOString().split('T')[0],
    },
  })

  const parrainId = form.watch('parrainId')
  const selectedParrain = parrains.find((p) => p.id === parrainId)

  useEffect(() => {
    if (selectedParrain?.ice && !form.getValues('ice')) {
      form.setValue('ice', selectedParrain.ice)
    }
  }, [selectedParrain, form])

  async function onSubmit(data: any) {
    try {
      const res = await fetch('/api/recus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dateEmission: data.dateEmission ? new Date(data.dateEmission) : undefined,
          numero: data.numero || undefined,
          parrainId: data.parrainId || undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.erreur || 'Erreur lors de la création')
      }

      const recu = await res.json()
      router.push(`/recus/${recu.id}`)
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nouveau reçu</h1>
        <p className="text-muted-foreground mt-2">
          Générer un nouveau reçu
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du reçu</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro (auto-généré si vide)</FormLabel>
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
                name="parrainId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parrain (optionnel)</FormLabel>
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
                            {parrain.nom} {parrain.prenom}
                            {parrain.type === 'SOCIETE' && ` (${parrain.ice})`}
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
                name="ice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ICE (si société)</FormLabel>
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <select
                        value={String(field.value ?? 'KAFALA')}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="KAFALA">Kafala</option>
                        <option value="DAAM_MADRASSI">Daam Madrassi</option>
                        <option value="AUTRE">Autre</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total (MAD) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={Number(field.value) || 0}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                name="dateEmission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'émission</FormLabel>
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

              <div className="flex gap-2">
                <Button type="submit">Créer</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/recus">Annuler</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

