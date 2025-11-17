import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Système de Gestion Kafala</h1>
            <div className="flex gap-2">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Tableau de bord</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/veuves">Veuves</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/orphelins">Orphelins</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/parrains">Parrains</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/parrainages">Parrainages</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/paiements">Paiements</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/recus">Reçus</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/virements">Virements</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

