// app/tesla/systems/page.tsx
import SystemsHero from "@/components/systems/SystemsHero";
import SystemsMap from "@/components/systems/SystemsMap";
import SystemsCards from "@/components/systems/SystemsCards";
import SystemsCausalIntelligence from "@/components/systems/SystemsCausalIntelligence";
import SystemsInsightPanel from "@/components/systems/SystemsInsightPanel";

export default function TeslaSystemsPage() {
  return (
    <div className="space-y-10 px-4 py-6">
      <SystemsHero />

      <SystemsMap />

      <SystemsCards />

      <SystemsCausalIntelligence />

      <SystemsInsightPanel />
    </div>
  );
}
