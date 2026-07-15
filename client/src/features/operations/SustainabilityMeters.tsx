// Sustainability metrics for the current event day, shown as labelled stat
// tiles.
import type { SustainabilityMetrics } from '../../lib/api-types.js';

interface SustainabilityMetersProps {
  metrics: SustainabilityMetrics;
}

/** Four sustainability stat tiles. */
export function SustainabilityMeters({ metrics }: SustainabilityMetersProps): React.JSX.Element {
  const tiles = [
    { label: 'Waste diverted from landfill', value: `${String(metrics.wasteDivertedPct)}%` },
    { label: 'Energy used today', value: `${metrics.energyKwh.toLocaleString()} kWh` },
    { label: 'Water bottle refills', value: metrics.waterRefillCount.toLocaleString() },
    { label: 'CO₂ saved vs. baseline', value: `${metrics.co2SavedKg.toLocaleString()} kg` },
  ];

  return (
    <div className="metric-grid">
      {tiles.map((tile) => (
        <div key={tile.label} className="metric">
          <p className="metric__value">{tile.value}</p>
          <p className="metric__label">{tile.label}</p>
        </div>
      ))}
    </div>
  );
}
