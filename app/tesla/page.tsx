"use client";

import TeslaIntelligenceHub from "@/components/tesla/TeslaIntelligenceHub";
import { IndustrialRegimeCard } from "@/components/intelligence/industrial/IndustrialRegimeCard";
import { useEffect, useState } from "react";

export default function TeslaHubPage() {
  const [intelligence, setIntelligence] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dev/test-industrial-intelligence")
      .then((res) => res.json())
      .then((data) => setIntelligence(data.intelligence));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Tesla Intelligence Hub</h1>

      <TeslaIntelligenceHub />

      {intelligence && (
        <div className="mt-8">
          <IndustrialRegimeCard intelligence={intelligence} />
        </div>
      )}
    </div>
  );
}