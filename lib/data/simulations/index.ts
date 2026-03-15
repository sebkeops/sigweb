import type { SimulationData } from '@/types'
import boulangerie from './boulangerie.json'
import pizzeria from './pizzeria.json'
import boucherie from './boucherie.json'
import coiffure from './coiffure.json'

const simulations: Record<string, SimulationData> = {
  boulangerie: boulangerie as SimulationData,
  pizzeria: pizzeria as SimulationData,
  boucherie: boucherie as SimulationData,
  coiffure: coiffure as SimulationData,
}

export function getAllSimulationSlugs(): string[] {
  return Object.keys(simulations)
}

export function getSimulationBySlug(slug: string): SimulationData | null {
  return simulations[slug] ?? null
}
