import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcrypt'
import { recomputeNombreParrainages, generateEcheances } from '../src/lib/kafala'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Démarrage du seed...')

  // Nettoyer la base de données
  await prisma.paiement.deleteMany()
  await prisma.echeance.deleteMany()
  await prisma.parrainage.deleteMany()
  await prisma.virement.deleteMany()
  await prisma.recu.deleteMany()
  await prisma.orphelin.deleteMany()
  await prisma.veuve.deleteMany()
  await prisma.parrain.deleteMany()
  await prisma.utilisateur.deleteMany()

  console.log('✅ Base de données nettoyée')

  // Créer un utilisateur admin
  const hash = await bcrypt.hash('admin123', 10)
  await prisma.utilisateur.create({
    data: {
      email: 'admin@kafala.local',
      hash,
      role: 'ADMIN',
    },
  })
  console.log('✅ Utilisateur admin créé')

  // Créer 2 veuves
  const veuve1 = await prisma.veuve.create({
    data: {
      nom: 'Amina',
      prenom: 'Ali',
      cin: 'AA12345',
      rib: 'RIB123',
      tel: '0612345678',
    },
  })

  const veuve2 = await prisma.veuve.create({
    data: {
      nom: 'Fatima',
      prenom: 'Hassan',
      cin: 'FH67890',
      rib: 'RIB456',
      tel: '0698765432',
    },
  })
  console.log('✅ Veuves créées')

  // Créer 2 orphelins
  const orphelin1 = await prisma.orphelin.create({
    data: {
      nom: 'Youssef',
      prenom: 'Ali',
      dateNaissance: new Date('2010-05-10'),
      veuveId: veuve1.id,
    },
  })

  const orphelin2 = await prisma.orphelin.create({
    data: {
      nom: 'Sara',
      prenom: 'Hassan',
      dateNaissance: new Date('2012-08-15'),
      veuveId: veuve2.id,
    },
  })
  console.log('✅ Orphelins créés')

  // Créer 1 parrain avec valeurKafala = 600
  const valeurKafala = new Prisma.Decimal(600)
  const parrain = await prisma.parrain.create({
    data: {
      nom: 'Ahmed',
      prenom: 'Khalid',
      cin: 'AK4567',
      valeurKafala,
      type: 'PERSONNE_PHYSIQUE',
      email: 'ahmed@example.com',
      nombreParrainages: 0, // Sera recalculé
    },
  })
  console.log('✅ Parrain créé (valeurKafala: 600 MAD)')

  // Créer 2 parrainages actifs
  const parrainage1 = await prisma.parrainage.create({
    data: {
      parrainId: parrain.id,
      orphelinId: orphelin1.id,
      dateDebut: new Date(),
      valeurKafala: 600,
    },
  })

  const parrainage2 = await prisma.parrainage.create({
    data: {
      parrainId: parrain.id,
      orphelinId: orphelin2.id,
      dateDebut: new Date(),
      valeurKafala: 600,
    },
  })
  console.log('✅ Parrainages créés (2 actifs)')

  // Recalculer nombreParrainages
  const nombreParrainages = await recomputeNombreParrainages(parrain.id)
  console.log(`✅ nombreParrainages recalculé: ${nombreParrainages}`)

  // Générer les échéances pour chaque parrainage
  // montantDu = 600 / 2 = 300 par orphelin/mois
  for (const parrainage of [parrainage1, parrainage2]) {
    await generateEcheances(
      parrainage.id,
      parrainage.dateDebut,
      valeurKafala,
      nombreParrainages,
      null
    )
  }
  console.log('✅ Échéances générées (montantDu = 300 MAD par orphelin/mois)')

  console.log('\n✅ Seed terminé avec succès!')
  console.log('\n📊 Résumé:')
  console.log(`   - Parrain: ${parrain.nom} ${parrain.prenom}`)
  console.log(`   - Valeur Kafala: 600 MAD`)
  console.log(`   - Nombre de parrainages actifs: ${nombreParrainages}`)
  console.log(`   - Montant par orphelin/mois: ${600 / nombreParrainages} MAD`)
  console.log(`   - Orphelins: ${orphelin1.nom} ${orphelin1.prenom}, ${orphelin2.nom} ${orphelin2.prenom}`)
}

main()
  .then(() => {
    console.log('\n🎉 Seed complété!')
  })
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
