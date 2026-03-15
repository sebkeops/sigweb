import type { SimulationData } from '@/types'
import { SimulationDataSchema } from '@/lib/validations/simulation'
import boulangerie from './boulangerie.json'
import pizzeria from './pizzeria.json'
import boucherie from './boucherie.json'
import coiffure from './coiffure.json'

function parseSimulation(raw: unknown, name: string): SimulationData {
  const result = SimulationDataSchema.safeParse(raw)
  if (!result.success) {
    console.error(`[simulations] JSON invalide pour "${name}":`, result.error.flatten())
  }
  return (result.success ? result.data : raw) as SimulationData
}

const simulations: Record<string, SimulationData> = {
  boulangerie: parseSimulation(boulangerie, 'boulangerie'),
  pizzeria: parseSimulation(pizzeria, 'pizzeria'),
  boucherie: parseSimulation(boucherie, 'boucherie'),
  coiffure: parseSimulation(coiffure, 'coiffure'),
}

export function getAllSimulationSlugs(): string[] {
  return Object.keys(simulations)
}

export function getSimulationBySlug(slug: string): SimulationData | null {
  return simulations[slug] ?? null
}
