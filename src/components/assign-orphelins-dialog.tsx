'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface AssignOrphelinsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parrainId: string
  valeurKafala: number
  onSuccess: () => void
}

export function AssignOrphelinsDialog({
  open,
  onOpenChange,
  parrainId,
  valeurKafala,
  onSuccess,
}: AssignOrphelinsDialogProps) {
  const [orphelins, setOrphelins] = useState<any[]>([])
  const [selectedOrphelins, setSelectedOrphelins] = useState<string[]>([])
  const [closePrevious, setClosePrevious] = useState(false)
  const [loading, setLoading] = useState(false)
  const [orphelinsAvecParrainActif, setOrphelinsAvecParrainActif] = useState<
    string[]
  >([])

  useEffect(() => {
    if (open) {
      fetch('/api/orphelins')
        .then((res) => res.json())
        .then((data) => {
          setOrphelins(data)
          // Identifier les orphelins avec parrain actif
          const avecParrainActif = data
            .filter((o: any) => o.parrainActuel)
            .map((o: any) => o.id)
          setOrphelinsAvecParrainActif(avecParrainActif)
        })
    }
  }, [open])

  const handleToggleOrphelin = (orphelinId: string) => {
    if (selectedOrphelins.includes(orphelinId)) {
      setSelectedOrphelins(selectedOrphelins.filter((id) => id !== orphelinId))
    } else {
      setSelectedOrphelins([...selectedOrphelins, orphelinId])
    }
  }

  const handleSubmit = async () => {
    if (selectedOrphelins.length === 0) {
      alert('Veuillez sélectionner au moins un orphelin')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/parrains/${parrainId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orphelinIds: selectedOrphelins,
          closePrevious,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.erreur || 'Erreur lors de l\'assignation')
      }

      alert('Orphelins assignés avec succès')
      setSelectedOrphelins([])
      setClosePrevious(false)
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const hasOrphelinsAvecParrainActif = selectedOrphelins.some((id) =>
    orphelinsAvecParrainActif.includes(id)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assigner des orphelins</DialogTitle>
          <DialogDescription>
            Sélectionnez les orphelins à assigner à ce parrain
          </DialogDescription>
        </DialogHeader>

        {hasOrphelinsAvecParrainActif && (
          <Alert variant="destructive">
            <AlertDescription>
              Certains orphelins sélectionnés ont déjà un parrain actif. Cochez
              la case ci-dessous pour clôturer automatiquement les anciens
              parrainages.
            </AlertDescription>
          </Alert>
        )}

        <div className="max-h-96 overflow-y-auto space-y-2">
          {orphelins.map((orphelin) => {
            const hasParrainActif = orphelinsAvecParrainActif.includes(orphelin.id)
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
                  <Badge variant="secondary">Parrain actif</Badge>
                )}
              </div>
            )
          })}
        </div>

        {hasOrphelinsAvecParrainActif && (
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
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Assignation...' : 'Assigner'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

