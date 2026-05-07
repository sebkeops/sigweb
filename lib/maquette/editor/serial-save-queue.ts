/**
 * File d'attente sérialisée à 1-slot pour les saves d'éditeur.
 *
 * Garantie : à tout moment, **un seul** appel à `saveFn` est en cours.
 * Si `enqueue` est appelée pendant qu'un save tourne, le dernier payload
 * écrase les précédents (slot unique) — quand le save courant termine,
 * le slot est consommé et un nouveau save part avec ce dernier payload.
 *
 * Cas d'usage : drag & drop photos où 3 drops rapides ne doivent pas
 * créer 3 fetches parallèles (race condition côté BDD via lock optimiste).
 *
 * Le `EditorContext` réimplémente cette logique avec en plus la gestion
 * des statuts (saving/saved/error) et du retry. Ce module pur est extrait
 * principalement pour la testabilité du pattern de sérialisation.
 */

export interface SerialSaveQueue<T> {
  /** Schedule un save. Le dernier payload écrase les précédents en attente. */
  enqueue(payload: T): void
  /** Attend que la queue soit vide (utile en tests). */
  waitIdle(): Promise<void>
  /** True s'il y a un save en cours OU en attente. */
  isBusy(): boolean
}

export function createSerialSaveQueue<T>(
  saveFn: (payload: T) => Promise<unknown>
): SerialSaveQueue<T> {
  let pending: T | null = null
  let hasPending = false
  let current: Promise<void> | null = null

  async function runLoop(): Promise<void> {
    while (hasPending) {
      const payload = pending as T
      pending = null
      hasPending = false
      try {
        await saveFn(payload)
      } catch {
        // Erreurs silenced ici — la gestion d'erreur est de la responsabilité
        // de saveFn (qui peut faire son propre retry). Le but de la queue est
        // uniquement la sérialisation.
      }
    }
    current = null
  }

  return {
    enqueue(payload: T) {
      pending = payload
      hasPending = true
      if (!current) {
        current = runLoop()
      }
    },
    async waitIdle() {
      while (current) {
        await current
      }
    },
    isBusy() {
      return current !== null || hasPending
    },
  }
}
