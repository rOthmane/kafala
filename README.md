# Application de Gestion Kafala

Application web de gestion de parrainage d'orphelins utilisant Next.js 14, TypeScript, Prisma, PostgreSQL, Tailwind CSS et shadcn/ui.

## Installation

```bash
pnpm install
```

## Configuration de la base de données

### Migration et reset de la base de données

Pour appliquer les migrations et réinitialiser la base de données avec les données de seed :

```bash
# Créer et appliquer la migration
pnpm prisma migrate dev --name kafala_share_update

# Réinitialiser la base de données (supprime toutes les données et réapplique les migrations)
pnpm run db:reset

# Exécuter le seed (création de données de test)
pnpm prisma db seed

# Démarrer le serveur de développement
pnpm dev
```

### Données de seed

Le seed crée :
- 1 utilisateur admin (email: `admin@kafala.local`, mot de passe: `admin123`)
- 1 parrain avec valeurKafala = 600 MAD
- 2 veuves
- 2 orphelins
- 2 parrainages actifs
- Échéances générées avec montantDu = 300 MAD par orphelin/mois (600 / 2)

## Fonctionnalités

### Logique Kafala

- **Répartition équitable** : La valeurKafala mensuelle est répartie à parts égales entre tous les parrainages actifs
- **Montant par échéance** : `montantDu = valeurKafala / nombreParrainages` pour chaque orphelin
- **Allocation FIFO** : Les paiements sont alloués aux échéances les plus anciennes non soldées
- **Recalcul automatique** : Les montants des échéances sont recalculés automatiquement lors de :
  - Création/fermeture d'un parrainage
  - Modification de la valeurKafala
  - Changement du nombre de parrainages actifs

### Paiements Kafala

- Formulaire simplifié : Seuls les champs Parrain et Montant sont requis
- Prévisualisation : Possibilité de prévisualiser l'allocation avant validation
- Édition : Modification des montants affectés avant soumission
- Traçabilité : Détail complet de l'allocation dans `Paiement.allocation`

## Structure du projet

- `src/app/api/` - Routes API (CRUD pour toutes les entités)
- `src/app/(app)/` - Pages de l'application
- `src/lib/` - Utilitaires et logique métier
- `prisma/schema.prisma` - Schéma de base de données
- `prisma/seed.ts` - Script de seed

## Technologies

- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Prisma** - ORM pour PostgreSQL
- **PostgreSQL** - Base de données
- **Tailwind CSS** - Styles utilitaires
- **shadcn/ui** - Composants UI
- **Zod** - Validation de schémas
- **React Hook Form** - Gestion de formulaires
