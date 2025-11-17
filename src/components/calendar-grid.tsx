'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CalendarGridProps {
  echeances: Array<{
    mois: string | Date
    montantDu: number
    montantPaye: number
    soldée: boolean
  }>
}

export function CalendarGrid({ echeances }: CalendarGridProps) {
  const moisLabels = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ]

  // Organiser les échéances par année et mois
  const echeancesByYear: Record<
    number,
    Record<number, { montantDu: number; montantPaye: number; soldée: boolean }>
  > = {}

  echeances.forEach((echeance) => {
    const date = new Date(echeance.mois)
    const year = date.getFullYear()
    const month = date.getMonth()

    if (!echeancesByYear[year]) {
      echeancesByYear[year] = {}
    }

    echeancesByYear[year][month] = {
      montantDu: echeance.montantDu,
      montantPaye: echeance.montantPaye,
      soldée: echeance.soldée,
    }
  })

  const years = Object.keys(echeancesByYear)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="space-y-6">
      {years.map((year) => (
        <Card key={year}>
          <CardHeader>
            <CardTitle>{year}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {moisLabels.map((mois, index) => {
                const echeance = echeancesByYear[year]?.[index]
                const isCurrentMonth =
                  new Date().getFullYear() === year &&
                  new Date().getMonth() === index

                return (
                  <div
                    key={index}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-3 ${
                      isCurrentMonth ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="text-sm font-medium">{mois}</div>
                    {echeance ? (
                      <div className="flex flex-col items-center gap-1">
                        {echeance.soldée ? (
                          <Badge variant="default" className="bg-green-500">
                            Payé
                          </Badge>
                        ) : echeance.montantPaye > 0 ? (
                          <Badge variant="secondary">Partiel</Badge>
                        ) : (
                          <Badge variant="destructive">Non payé</Badge>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {new Intl.NumberFormat('fr-MA', {
                            style: 'currency',
                            currency: 'MAD',
                            maximumFractionDigits: 0,
                          }).format(echeance.montantPaye)}
                          /{' '}
                          {new Intl.NumberFormat('fr-MA', {
                            style: 'currency',
                            currency: 'MAD',
                            maximumFractionDigits: 0,
                          }).format(echeance.montantDu)}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        -
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

