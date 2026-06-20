"use client";

import { useState, useEffect } from "react";

export type SystemCausal = {
  name: string;
  summary: string;
  drivers: string[];
  impact: number; // 1–5
};

export function useSystemsCausal() {
  const [data, setData] = useState<SystemCausal[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const systems: SystemCausal[] = [
        {
          name: "Vehicles",
          summary:
            "Tesla’s vehicle production benefits from battery efficiency, software platform standardization, and automated assembly lines.",
          drivers: [
            "Battery and cost reduction",
            "Automation in factories",
            "Vehicle platform standardization",
          ],
          impact: 5,
        },
        {
          name: "Energy",
          summary:
            "Energy storage and solar integration support Tesla’s charging network and provide recurring high-margin revenue streams.",
          drivers: [
            "Megapack scaling",
            "Grid stability solutions",
            "Integration with fleet charging",
          ],
          impact: 4,
        },
        {
          name: "Optimus",
          summary:
            "Robotics automation is deployed to reduce labor costs, increase factory efficiency, and accelerate production scaling.",
          drivers: [
            "Factory task automation",
            "AI-driven operations",
            "Labor cost reduction",
          ],
          impact: 3,
        },
        {
          name: "Factories & Manufacturing",
          summary:
            "Factories are optimized for capacity expansion, process efficiency, and integration with autonomous robotics.",
          drivers: [
            "Production line optimization",
            "Optimus integration",
            "Throughput and capital efficiency",
          ],
          impact: 4,
        },
      ];

      const timer = setTimeout(() => {
        setData(systems);
        setLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate systems intelligence.");
      setLoading(false);
    }
  }, []);

  return { data, loading, error };
}
