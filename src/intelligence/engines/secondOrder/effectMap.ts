import { Sector } from "@/intelligence/domain/types"

export type InfluenceMap = Record<
  Sector,
  Partial<Record<Sector, number>>
>

/*
Base structural influence between sectors.

Meaning:
0.6 = strong influence
0.3 = moderate influence
0.1 = weak influence
*/

export const interSectorInfluence: InfluenceMap = {
  EV: {
    AI: 0.45,
    AEROSPACE: 0.15,
  },

  AI: {
    EV: 0.55,
    AEROSPACE: 0.35,
  },

  AEROSPACE: {
    AI: 0.20,
    EV: 0.15,
  },
}