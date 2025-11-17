'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PaiementCreateSchema } from '@/lib/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface AllocationPreview {
  orphelinId: string
  parrainageId: string
  echeanceId: string
  mois: Date | string
  montantAffecte: number
  orphelinNom: string
  orphelinPrenom: string
  montantDu: number
  montantPayeAvant: number
  montantRestantEcheance: number
}

function NewPaiementForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [parrains, setParrains] = useState<any[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [editedAllocations, setEditedAllocations] = useState<AllocationPreview[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)

  useEffect(() => {
    fetch('/api/parrains')
      .then((res) => res.json())
      .then((data) => setParrains(data))
  }, [])

  const form = useForm({
    resolver: zodResolver(PaiementCreateSchema),
    defaultValues: {
      parrainId: searchParams.get('parrainId') || '',
      type: (searchParams.get('type') as any) || 'KAFALA',
      montant: 0,
      datePaiement: new Date().toISOString().split('T')[0],
    },
  })

  const type = form.watch('type')
  const parrainId = form.watch('parrainId')
  const montant = form.watch('montant')

  const canPreview = type === 'KAFALA' && parrainId && montant > 0

  const handlePreview = async () => {
    if (!canPreview) return

    setLoadingPreview(true)
    try {
      const res = await fetch('/api/paiements/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parrainId,
          montant,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.erreur || 'Erreur lors de la prévisualisation')
      }

      const data = await res.json()
      setPreviewData(data)
      setEditedAllocations(data.allocations)
      setPreviewOpen(true)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleAllocationChange = (index: number, newValue: number) => {
    const updated = [...editedAllocations]
    updated[index] = {
      ...updated[index],
      montantAffecte: Math.max(0, newValue),
    }
    setEditedAllocations(updated)
  }

  async function onSubmit(data: any) {
    try {
      const body: any = {
        ...data,
        datePaiement: data.datePaiement ? new Date(data.datePaiement) : undefined,
        parrainId: data.parrainId || undefined,
      }

      // Si on a des allocations éditées, les inclure
      if (editedAllocations.length > 0 && type === 'KAFALA') {
        body.allocation = editedAllocations.map((a) => ({
          orphelinId: a.orphelinId,
          parrainageId: a.parrainageId,
          echeanceId: a.echeanceId,
          mois: typeof a.mois === 'string' ? new Date(a.mois) : a.mois,
          montantAffecte: a.montantAffecte,
        }))
      }

      const res = await fetch('/api/paiements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.erreur || 'Erreur lors de la création')
      }

      const paiement = await res.json()
      
      // Afficher un message de succès
      if (paiement.allocationStats) {
        alert(
          `Paiement créé avec succès!\n${paiement.allocationStats.nbOrphelins} orphelins, ${paiement.allocationStats.nbEcheances} échéances affectées.`
        )
      }

      router.push(`/paiements/${paiement.id}`)
    } catch (error: any) {
      if (error.message.includes('Aucun parrainage actif')) {
        alert('Aucun parrainage actif trouvé pour ce parrain')
      } else {
        alert(error.message)
      }
    }
  }

  const handleConfirmPreview = () => {
    setPreviewOpen(false)
    form.handleSubmit(onSubmit)()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nouveau paiement</h1>
        <p className="text-muted-foreground mt-2">
          Enregistrer un nouveau paiement
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du paiement</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="parrainId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Parrain {type === 'KAFALA' && '*'}
                    </FormLabel>
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
                name="montant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant (MAD) *</FormLabel>
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

              <FormField
                control={form.control}
                name="datePaiement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de paiement</FormLabel>
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

              {canPreview && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreview}
                    disabled={loadingPreview}
                  >
                    {loadingPreview ? 'Chargement...' : 'Prévisualiser l\'allocation'}
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit">Créer</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/paiements">Annuler</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prévisualisation de l'allocation</DialogTitle>
            <DialogDescription>
              La Valeur Kafala est répartie à parts égales sur les parrainages actifs ;
              l'allocation se fait par mois (FIFO). Vous pouvez modifier les montants affectés ci-dessous.
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Résumé:</strong> {Object.keys(previewData.montantsParOrphelin).length}{' '}
                  orphelins, {previewData.echeancesAffectees} échéances affectées.
                  {previewData.montantRestant > 0 && (
                    <span className="text-warning">
                      {' '}Montant restant: {previewData.montantRestant} MAD
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Orphelin</TableHead>
                      <TableHead>Parrainage</TableHead>
                      <TableHead>Mois</TableHead>
                      <TableHead>Montant affecté (MAD)</TableHead>
                      <TableHead>Restant échéance (MAD)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editedAllocations.map((alloc, index) => (
                      <TableRow key={`${alloc.echeanceId}-${index}`}>
                        <TableCell>
                          {alloc.orphelinNom} {alloc.orphelinPrenom}
                        </TableCell>
                        <TableCell>{alloc.parrainageId.slice(0, 8)}...</TableCell>
                        <TableCell>
                          {(() => {
                            const date = typeof alloc.mois === 'string' ? new Date(alloc.mois) : alloc.mois
                            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                          })()}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={alloc.montantAffecte}
                            onChange={(e) =>
                              handleAllocationChange(index, parseInt(e.target.value) || 0)
                            }
                            className="w-24"
                            min={0}
                            max={alloc.montantDu - alloc.montantPayeAvant}
                          />
                        </TableCell>
                        <TableCell>
                          {alloc.montantRestantEcheance.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleConfirmPreview}>Confirmer et créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function NewPaiementPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <NewPaiementForm />
    </Suspense>
  )
}
