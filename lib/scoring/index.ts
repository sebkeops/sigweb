export type { ScoringInput, ScoringResult, CriteriaResult } from './types'
export { computeScore } from './compute-score'
export {
  computeProximite,
  computeBesoinWeb,
  computeActivite,
  computeMalus,
} from './criteria'
export {
  PROXIMITE_LABELS,
  BESOIN_WEB_LABELS,
  ACTIVITE_LABELS,
  MALUS_LABELS,
} from './labels'
