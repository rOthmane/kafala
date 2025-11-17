'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ParrainageUpdateSchema } from '@/lib/validation'
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

export default function EditParrainagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [parrainage, setParrainage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<string>('')

  useEffect(() => {
    params.then((p) => {
      setId(p.id)
      fetch(`/api/parrainages/${p.id}`)
        .then((res) => res.json())
        .then((data) => {
          setParrainage(data)
          form.reset({
            parrainId: data.parrainId,
            orphelinId: data.orphelinId,
            dateDebut: new Date(data.dateDebut).toISOString().split('T')[0],
            dateFin: data.dateFin
              ? new Date(data.dateFin).toISOString().split('T')[0]
              : '',
            valeurKafala: typeof data.valeurKafala === 'object' && 'toNumber' in data.valeurKafala
              ? data.valeurKafala.toNumber()
              : Number(data.valeurKafala) || 0,
          })
          setLoading(false)
        })
    })
  }, [params])

  const form = useForm({
    resolver: zodResolver(ParrainageUpdateSchema),
    defaultValues: {
      parrainId: '',
      orphelinId: '',
      dateDebut: '',
      dateFin: '',
      valeurKafala: 0,
    },
  })

  async function onSubmit(data: any) {
    try {
      const res = await fetch(`/api/parrainages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
          dateFin: data.dateFin ? new Date(data.dateFin) : null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.erreur || 'Erreur lors de la mise à jour')
      }

      router.push(`/parrainages/${id}`)
    } catch (error: any) {
      alert(error.message)
    }
  }

  if (loading || !parrainage) {
    return <div>Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Modifier le parrainage</h1>
        <p className="text-muted-foreground mt-2">
          Modifier les informations du parrainage
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du parrainage</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <div>
                  Parrain: {parrainage.parrain.nom} {parrainage.parrain.prenom}
                </div>
                <div>
                  Orphelin: {parrainage.orphelin.nom} {parrainage.orphelin.prenom}
                </div>
              </div>

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
                <Button type="submit">Enregistrer</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/parrainages/${id}`}>Annuler</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

