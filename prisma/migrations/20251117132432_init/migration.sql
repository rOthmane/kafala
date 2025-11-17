-- CreateEnum
CREATE TYPE "TypeParrain" AS ENUM ('PERSONNE_PHYSIQUE', 'SOCIETE');

-- CreateEnum
CREATE TYPE "TypeSubvention" AS ENUM ('KAFALA', 'DAAM_MADRASSI', 'AUTRE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATEUR', 'LECTURE');

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERATEUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Veuve" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "CIN" TEXT,
    "rib" TEXT,
    "tel" TEXT,
    "adresse" TEXT,
    "cloturee" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Veuve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orphelin" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "dateNaissance" TIMESTAMP(3) NOT NULL,
    "ageCache" INTEGER,
    "suiviScolaire" JSONB,
    "veuveId" TEXT NOT NULL,
    "cloture" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Orphelin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parrain" (
    "id" TEXT NOT NULL,
    "type" "TypeParrain" NOT NULL DEFAULT 'PERSONNE_PHYSIQUE',
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "CIN" TEXT,
    "ice" TEXT,
    "email" TEXT,
    "tel" TEXT,
    "adresse" TEXT,
    "valeurKafala" INTEGER NOT NULL,
    "donateurCode" TEXT,
    "parrainCode" TEXT,
    "estMembre" BOOLEAN NOT NULL DEFAULT false,
    "estDonateur" BOOLEAN NOT NULL DEFAULT true,
    "estParrain" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parrain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parrainage" (
    "id" TEXT NOT NULL,
    "parrainId" TEXT NOT NULL,
    "orphelinId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "valeurKafala" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parrainage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Echeance" (
    "id" TEXT NOT NULL,
    "parrainageId" TEXT NOT NULL,
    "mois" TIMESTAMP(3) NOT NULL,
    "montantDu" INTEGER NOT NULL,
    "montantPaye" INTEGER NOT NULL DEFAULT 0,
    "soldée" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Echeance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "parrainId" TEXT,
    "orphelinId" TEXT,
    "veuveId" TEXT,
    "type" "TypeSubvention" NOT NULL DEFAULT 'KAFALA',
    "montant" INTEGER NOT NULL,
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recuId" TEXT,
    "allocation" JSONB,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recu" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "parrainId" TEXT,
    "ice" TEXT,
    "total" INTEGER NOT NULL,
    "type" "TypeSubvention" NOT NULL,
    "lignes" JSONB NOT NULL,
    "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Virement" (
    "id" TEXT NOT NULL,
    "veuveId" TEXT NOT NULL,
    "orphelinId" TEXT NOT NULL,
    "parrainId" TEXT NOT NULL,
    "valeurKafala" INTEGER NOT NULL,
    "nbMois" INTEGER NOT NULL,
    "dateVirement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Virement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Recu_numero_key" ON "Recu"("numero");

-- AddForeignKey
ALTER TABLE "Orphelin" ADD CONSTRAINT "Orphelin_veuveId_fkey" FOREIGN KEY ("veuveId") REFERENCES "Veuve"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parrainage" ADD CONSTRAINT "Parrainage_parrainId_fkey" FOREIGN KEY ("parrainId") REFERENCES "Parrain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parrainage" ADD CONSTRAINT "Parrainage_orphelinId_fkey" FOREIGN KEY ("orphelinId") REFERENCES "Orphelin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Echeance" ADD CONSTRAINT "Echeance_parrainageId_fkey" FOREIGN KEY ("parrainageId") REFERENCES "Parrainage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_parrainId_fkey" FOREIGN KEY ("parrainId") REFERENCES "Parrain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_orphelinId_fkey" FOREIGN KEY ("orphelinId") REFERENCES "Orphelin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_veuveId_fkey" FOREIGN KEY ("veuveId") REFERENCES "Veuve"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_recuId_fkey" FOREIGN KEY ("recuId") REFERENCES "Recu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recu" ADD CONSTRAINT "Recu_parrainId_fkey" FOREIGN KEY ("parrainId") REFERENCES "Parrain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Virement" ADD CONSTRAINT "Virement_veuveId_fkey" FOREIGN KEY ("veuveId") REFERENCES "Veuve"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Virement" ADD CONSTRAINT "Virement_orphelinId_fkey" FOREIGN KEY ("orphelinId") REFERENCES "Orphelin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Virement" ADD CONSTRAINT "Virement_parrainId_fkey" FOREIGN KEY ("parrainId") REFERENCES "Parrain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
