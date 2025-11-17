'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { OrphelinUpdateSchema } from '@/lib/validation'
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

export default function EditOrphelinPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [orphelin, setOrphelin] = useState<any>(null)
  const [veuves, setVeuves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<string>('')

  useEffect(() => {
    Promise.all([
      params.then((p) => {
        setId(p.id)
        return fetch(`/api/orphelins/${p.id}`)
      }),
      fetch('/api/veuves'),
    ])
      .then(([orphelinRes, veuvesRes]) =>
        Promise.all([orphelinRes.json(), veuvesRes.json()])
      )
      .then(([orphelinData, veuvesData]) => {
        setOrphelin(orphelinData)
        setVeuves(veuvesData)
        form.reset({
          nom: orphelinData.nom,
          prenom: orphelinData.prenom || '',
          dateNaissance: orphelinData.dateNaissance
            ? new Date(orphelinData.dateNaissance).toISOString().split('T')[0]
            : '',
          veuveId: orphelinData.veuveId,
          cloture: orphelinData.cloture,
        })
        setLoading(false)
      })
  }, [params])

  const form = useForm({
    resolver: zodResolver(OrphelinUpdateSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      dateNaissance: '',
      veuveId: '',
      cloture: false,
    },
  })

  async function onSubmit(data: any) {
    try {
      const res = await fetch(`/api/orphelins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.erreur || 'Erreur lors de la mise à jour')
      }

      router.push(`/orphelins/${id}`)
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
        <h1 className="text-3xl font-bold">Modifier l'orphelin</h1>
        <p className="text-muted-foreground mt-2">
          Modifier les informations de l'orphelin
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'orphelin</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              <FormField
                control={form.control}
                name="dateNaissance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de naissance *</FormLabel>
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
                name="veuveId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veuve *</FormLabel>
                    <FormControl>
                      <select
                        value={String(field.value ?? '')}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">Sélectionner une veuve</option>
                        {veuves.map((veuve) => (
                          <option key={veuve.id} value={veuve.id}>
                            {veuve.nom} {veuve.prenom}
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
                name="cloture"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <FormLabel>Clôturé</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit">Enregistrer</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/orphelins/${id}`}>Annuler</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

