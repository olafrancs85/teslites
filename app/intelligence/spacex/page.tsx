import SpaceXIntelligenceHub from "@/components/spacex/SpaceXIntelligenceHub";
import { useMacroSignal } from "@/components/intelligence/core/useMacroSignal";

export default function SpaceXPage() {
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">SpaceX Intelligence</h1>
      <SpaceXIntelligenceHub />
    </main>
  );
}
