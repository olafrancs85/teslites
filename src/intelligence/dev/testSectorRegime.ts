// /src/intelligence/dev/testSectorRegime.ts

import { buildSectorRegime } from "../core/SectorRegimeEngine"

const evRegime = buildSectorRegime({
  sector: "EV",
  momentum: 0.6,
  volatility: 0.55,
  capitalFlow: 0.5,
  innovationVelocity: 0.7
})

console.log("EV Regime Test Output:")
console.log(evRegime)