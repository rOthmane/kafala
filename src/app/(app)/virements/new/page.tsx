'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { VirementCreateSchema } from '@/lib/validation'
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

export default function NewVirementPage() {
  const router = useRouter()
  const [parrains, setParrains] = useState<any[]>([])
  const [orphelins, setOrphelins] = useState<any[]>([])
  const [veuves, setVeuves] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/parrains').then((res) => res.json()),
      fetch('/api/orphelins').then((res) => res.json()),
      fetch('/api/veuves').then((res) => res.json()),
    ]).then(([parrainsData, orphelinsData, veuvesData]) => {
      setParrains(parrainsData)
      setOrphelins(orphelinsData)
      setVeuves(veuvesData)
    })
  }, [])

  const form = useForm({
    resolver: zodResolver(VirementCreateSchema),
    defaultValues: {
      veuveId: '',
      orphelinId: '',
      parrainId: '',
      valeurKafala: 0,
      nbMois: 1,
      dateVirement: new Date().toISOString().split('T')[0],
    },
  })

  async function onSubmit(data: any) {
    try {
      const res = await fetch('/api/virements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dateVirement: data.dateVirement ? new Date(data.dateVirement) : undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.erreur || 'Erreur lors de la création')
      }

      const virement = await res.json()
      router.push(`/virements/${virement.id}`)
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nouveau virement</h1>
        <p className="text-muted-foreground mt-2">
          Enregistrer un nouveau virement
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du virement</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="veuveId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veuve *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">Sélectionner une veuve</option>
                        {veuves.map((veuve) => (
                          <option key={veuve.id} value={veuve.id}>
                            {veuve.nom} {veuve.prenom}
                            {veuve.rib && ` (RIB: ${veuve.rib})`}
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
                        {...field}
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
                name="parrainId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parrain *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">Sélectionner un parrain</option>
                        {parrains.map((parrain) => (
                          <option key={parrain.id} value={parrain.id}>
                            {parrain.nom} {parrain.prenom}
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

              <FormField
                control={form.control}
                name="nbMois"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de mois *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateVirement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date du virement</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit">Créer</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/virements">Annuler</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

