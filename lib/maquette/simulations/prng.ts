/**
 * PRNG (générateur pseudo-aléatoire) seedable et reproductible — utilisé
 * par les fakers pour que `buildFictiveSimulation({ seed })` produise le
 * même résultat à entrée constante.
 *
 * Algorithme : Mulberry32 (32-bit, période 2^32, qualité largement
 * suffisante pour générer du faux contenu). Seed string → uint32 via un
 * hash léger inspiré de cyrb53.
 *
 * Pas de dépendance externe.
 */

/**
 * Hash léger d'une string en uint32. Déterministe, suffisamment dispersif
 * pour servir de seed à Mulberry32 (on n'a pas besoin de qualité cryptographique).
 */
function stringToSeed(input: string): number {
  let h1 = 0xdeadbeef ^ 0
  let h2 = 0x41c6ce57 ^ 0
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)) >>> 0
}

export interface Prng {
  /** Float [0, 1). */
  next: () => number
  /** Entier [min, max] inclus. */
  intBetween: (min: number, max: number) => number
  /** Élément aléatoire d'un tableau non vide. */
  pick: <T>(arr: readonly T[]) => T
  /** Plusieurs éléments uniques d'un tableau (sans tirage avec remise). */
  pickN: <T>(arr: readonly T[], n: number) => T[]
  /** True avec probabilité `p` (0..1). */
  chance: (p: number) => boolean
}

/**
 * Construit un PRNG seedable. La seed est passée en string pour
 * permettre du "human-friendly" (slug du métier, nom du commerce, etc.).
 */
export function makePrng(seed: string): Prng {
  let state = stringToSeed(seed)

  // Mulberry32 — petit et de qualité raisonnable.
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const intBetween = (min: number, max: number): number => {
    if (max < min) throw new Error(`intBetween: max (${max}) < min (${min})`)
    return Math.floor(next() * (max - min + 1)) + min
  }

  const pick = <T,>(arr: readonly T[]): T => {
    if (arr.length === 0) throw new Error('pick: tableau vide')
    return arr[intBetween(0, arr.length - 1)] as T
  }

  const pickN = <T,>(arr: readonly T[], n: number): T[] => {
    if (n > arr.length) {
      throw new Error(`pickN: n (${n}) > arr.length (${arr.length})`)
    }
    // Fisher-Yates partiel — coupé à n.
    const copy = [...arr]
    for (let i = 0; i < n; i++) {
      const j = intBetween(i, copy.length - 1)
      ;[copy[i], copy[j]] = [copy[j] as T, copy[i] as T]
    }
    return copy.slice(0, n)
  }

  const chance = (p: number): boolean => next() < p

  return { next, intBetween, pick, pickN, chance }
}
