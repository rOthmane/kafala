/**
 * Helper pour les appels API côté serveur
 * Utilise l'URL absolue si disponible, sinon localhost pour le développement
 */
export function getApiUrl(path: string): string {
  if (typeof window !== 'undefined') {
    // Côté client, utiliser l'URL relative
    return path
  }
  
  // Côté serveur, utiliser l'URL absolue
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  
  return `${baseUrl}${path}`
}

