import { z } from 'zod'

// Enums
export const TypeParrainSchema = z.enum(['PERSONNE_PHYSIQUE', 'SOCIETE'])
export const TypeSubventionSchema = z.enum(['KAFALA', 'DAAM_MADRASSI', 'AUTRE'])

// Veuve
export const VeuveCreateSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().optional(),
  cin: z.string().optional(),
  rib: z.string().optional(),
  tel: z.string().optional(),
  adresse: z.string().optional(),
  cloturee: z.boolean().default(false),
})

export const VeuveUpdateSchema = VeuveCreateSchema.partial()

// Orphelin
export const OrphelinCreateSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().optional(),
  dateNaissance: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val.length === 0) {
        return undefined
      }
      return val
    },
    z.coerce.date().refine((date) => !isNaN(date.getTime()), {
      message: 'La date de naissance est requise',
    })
  ),
  veuveId: z.string().min(1, 'La veuve est requise'),
  suiviScolaire: z.record(z.string(), z.any()).optional(),
  cloture: z.boolean().default(false),
})

export const OrphelinUpdateSchema = OrphelinCreateSchema.partial()

// Parrain
export const ParrainCreateSchema = z.object({
  type: TypeParrainSchema,
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().optional(),
  cin: z.string().optional(),
  ice: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  tel: z.string().optional(),
  adresse: z.string().optional(),
  valeurKafala: z.number().positive('La valeur Kafala doit être positive'),
  nombreParrainages: z.number().int().positive().optional(),
  donateurCode: z.string().optional(),
  parrainCode: z.string().optional(),
  estMembre: z.boolean().default(false),
  estDonateur: z.boolean().default(true),
  estParrain: z.boolean().default(true),
})

export const ParrainUpdateSchema = ParrainCreateSchema.partial()

// Parrainage
export const ParrainageCreateSchema = z.object({
  parrainId: z.string().min(1, 'Le parrain est requis'),
  orphelinId: z.string().min(1, "L'orphelin est requis"),
  dateDebut: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val.length === 0) {
        return undefined
      }
      return val
    },
    z.coerce.date().refine((date) => !isNaN(date.getTime()), {
      message: 'La date de début est requise',
    })
  ),
  dateFin: z.coerce.date().optional().nullable(),
  valeurKafala: z.number().int().positive('La valeur Kafala doit être positive'),
})

export const ParrainageUpdateSchema = ParrainageCreateSchema.partial()

// Paiement - Schéma pour paiement KAFALA
export const PaiementCreateKafalaSchema = z.object({
  type: z.literal('KAFALA'),
  parrainId: z.string().min(1, 'Le parrain est requis pour un paiement Kafala'),
  montant: z.number().positive('Le montant doit être positif'),
  datePaiement: z.coerce.date().optional(),
  recuId: z.string().optional(),
  allocation: z.array(z.object({
    orphelinId: z.string(),
    parrainageId: z.string(),
    echeanceId: z.string(),
    mois: z.coerce.date(),
    montantAffecte: z.number(),
  })).optional(),
}).refine((data) => {
  // Interdire orphelinId et veuveId pour KAFALA
  return true
}, {
  message: 'Les champs orphelinId et veuveId ne sont pas autorisés pour un paiement Kafala',
})

// Paiement - Schéma général avec validation conditionnelle
export const PaiementCreateSchema = z.object({
  parrainId: z.string().optional(),
  orphelinId: z.string().optional(),
  veuveId: z.string().optional(),
  type: TypeSubventionSchema.default('KAFALA'),
  montant: z.number().positive('Le montant doit être positif'),
  datePaiement: z.coerce.date().optional(),
  recuId: z.string().optional(),
  allocation: z.array(z.object({
    orphelinId: z.string(),
    parrainageId: z.string(),
    echeanceId: z.string(),
    mois: z.coerce.date(),
    montantAffecte: z.number(),
  })).optional(),
}).refine((data) => {
  // Si type est KAFALA, parrainId est requis et orphelinId/veuveId ne doivent pas être fournis
  if (data.type === 'KAFALA') {
    if (!data.parrainId) {
      return false
    }
    if (data.orphelinId || data.veuveId) {
      return false
    }
  }
  return true
}, {
  message: 'Pour un paiement Kafala, le parrain est requis et les champs orphelin et veuve ne sont pas autorisés',
  path: ['type'],
})

export const PaiementUpdateSchema = PaiementCreateSchema.partial()

// Recu
export const RecuCreateSchema = z.object({
  numero: z.string().min(1, 'Le numéro est requis'),
  parrainId: z.string().optional(),
  ice: z.string().optional(),
  total: z.number().int().positive('Le total doit être positif'),
  type: TypeSubventionSchema,
  lignes: z.record(z.string(), z.any()).optional(),
  dateEmission: z.coerce.date().optional(),
})

export const RecuUpdateSchema = RecuCreateSchema.partial()

// Virement
export const VirementCreateSchema = z.object({
  veuveId: z.string().min(1, 'La veuve est requise'),
  orphelinId: z.string().min(1, "L'orphelin est requis"),
  parrainId: z.string().min(1, 'Le parrain est requis'),
  valeurKafala: z.number().int().positive('La valeur Kafala doit être positive'),
  nbMois: z.number().int().positive('Le nombre de mois doit être positif'),
  dateVirement: z.coerce.date().optional(),
})

export const VirementUpdateSchema = VirementCreateSchema.partial()

// Types exportés
export type VeuveCreate = z.infer<typeof VeuveCreateSchema>
export type VeuveUpdate = z.infer<typeof VeuveUpdateSchema>
export type OrphelinCreate = z.infer<typeof OrphelinCreateSchema>
export type OrphelinUpdate = z.infer<typeof OrphelinUpdateSchema>
export type ParrainCreate = z.infer<typeof ParrainCreateSchema>
export type ParrainUpdate = z.infer<typeof ParrainUpdateSchema>
export type ParrainageCreate = z.infer<typeof ParrainageCreateSchema>
export type ParrainageUpdate = z.infer<typeof ParrainageUpdateSchema>
export type PaiementCreate = z.infer<typeof PaiementCreateSchema>
export type PaiementUpdate = z.infer<typeof PaiementUpdateSchema>
export type RecuCreate = z.infer<typeof RecuCreateSchema>
export type RecuUpdate = z.infer<typeof RecuUpdateSchema>
export type VirementCreate = z.infer<typeof VirementCreateSchema>
export type VirementUpdate = z.infer<typeof VirementUpdateSchema>

