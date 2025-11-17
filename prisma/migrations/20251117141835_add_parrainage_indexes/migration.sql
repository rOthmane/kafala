-- CreateIndex
CREATE INDEX "Parrainage_orphelinId_dateDebut_idx" ON "Parrainage"("orphelinId", "dateDebut");

-- CreateIndex
CREATE INDEX "Parrainage_parrainId_dateDebut_idx" ON "Parrainage"("parrainId", "dateDebut");
