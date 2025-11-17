/*
  Warnings:

  - You are about to alter the column `montantDu` on the `Echeance` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - You are about to alter the column `montantPaye` on the `Echeance` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - You are about to alter the column `montant` on the `Paiement` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - You are about to alter the column `valeurKafala` on the `Parrain` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "Echeance" ALTER COLUMN "montantDu" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "montantPaye" SET DEFAULT 0,
ALTER COLUMN "montantPaye" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Paiement" ALTER COLUMN "montant" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Parrain" ADD COLUMN     "nombreParrainages" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "valeurKafala" SET DATA TYPE DECIMAL(10,2);
