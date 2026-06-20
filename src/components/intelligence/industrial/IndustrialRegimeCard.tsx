"use client";

import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import type {
  IndustrialIntelligence,
  SectorSnapshot,
  RegimeState,
} from "@/intelligence/domain/types";

interface IndustrialRegimeCardProps {
  intelligence: IndustrialIntelligence;
}

export const IndustrialRegimeCard: React.FC<IndustrialRegimeCardProps> = ({
  intelligence,
}) => {
  const { snapshot, divergence, narrative } = intelligence;

  const getRegimeColor = (regime: RegimeState) => {
    switch (regime) {
      case "Acceleration":
        return "bg-green-500 text-white";
      case "Expansion":
        return "bg-blue-500 text-white";
      case "Compression":
        return "bg-orange-500 text-white";
      case "Stress":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-300 text-black";
    }
  };

  const getConfidenceGradient = (confidence: number) => {
    if (confidence < 0.5) {
      return "linear-gradient(to right, #ef4444, #facc15)";
    }
    return "linear-gradient(to right, #facc15, #22c55e)";
  };

  return (
    <div className="p-6 bg-gray-50 rounded-2xl shadow-xl max-w-xl mx-auto border border-gray-200">
      
      {/* Headline */}
      <h2 className="text-2xl font-bold mb-2 text-gray-900">
        {narrative.headline}
      </h2>

      <p className="text-gray-900 mb-4">{narrative.summary}</p>

      {/* Sector Overview */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2 text-gray-900">
          Sector Overview
        </h3>

        {snapshot.sectors.map((s: SectorSnapshot) => (
          <div key={s.sector} className="mb-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">
                {s.sector}
              </span>

              <span
                className={`px-2 py-1 rounded-full text-sm font-semibold ${getRegimeColor(
                  s.regimeState
                )}`}
              >
                {s.regimeState}
              </span>
            </div>

            <div className="h-3 w-full bg-gray-200 rounded mt-1 overflow-hidden">
              <div
                className="h-3 rounded transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.max(0, Math.min(1, s.momentum)) * 100}%`,
                  background: getConfidenceGradient(s.confidence),
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* System Metrics */}
      <div className="mb-4 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-semibold mb-2 text-gray-900">
          System Metrics
        </h3>

        <div className="text-gray-900">
          Average Momentum: {snapshot.averageMomentum.toFixed(2)}
        </div>

        <div className="text-gray-900">
          Volatility: {snapshot.averageVolatility.toFixed(2)}
        </div>

        <div className="text-gray-900">
          Capital Flow: {snapshot.averageCapitalFlow.toFixed(2)}
        </div>

        <div className="text-gray-900">
          Systemic Fragility: {snapshot.systemicFragility.toFixed(2)}
        </div>

        <div className="text-gray-900">
          Confidence: {snapshot.confidence.toFixed(2)}
        </div>
      </div>

      {/* Divergence */}
      {divergence?.divergence && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
          <FaExclamationTriangle className="text-red-500 mt-1" />

          <div>
            <h3 className="font-semibold mb-1 text-gray-900">
              Divergence
            </h3>

            <div className="text-gray-900">
              {divergence.description}
            </div>

            <div className="text-gray-900">
              Divergence Score: {divergence.divergenceScore}
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      <div>
        <h3 className="font-semibold mb-2 text-gray-900">
          Insights
        </h3>

        <ul className="list-disc list-inside text-gray-900">
          {narrative.insights.map((insight: string, idx: number) => (
            <li key={idx}>{insight}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};