'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { OrphelinCreateSchema } from '@/lib/validation'
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

export default function NewOrphelinPage() {
  const router = useRouter()
  const [veuves, setVeuves] = useState<any[]>([])
  
  useEffect(() => {
    fetch('/api/veuves')
      .then((res) => res.json())
      .then((data) => setVeuves(data))
  }, [])

  const form = useForm({
    resolver: zodResolver(OrphelinCreateSchema),
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
      const res = await fetch('/api/orphelins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dateNaissance: new Date(data.dateNaissance),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.erreur || 'Erreur lors de la création')
      }

      const orphelin = await res.json()
      router.push(`/orphelins/${orphelin.id}`)
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nouvel orphelin</h1>
        <p className="text-muted-foreground mt-2">
          Créer un nouveau profil d'orphelin
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

              <div className="flex gap-2">
                <Button type="submit">Créer</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/orphelins">Annuler</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

