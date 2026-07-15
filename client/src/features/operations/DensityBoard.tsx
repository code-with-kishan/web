// Live crowd-density board. Each zone shows occupancy, a labelled progress
// meter and a colour-plus-text status so it is not colour-only.
import type { ZoneOccupancy, ZoneStatus } from '../../lib/api-types.js';

interface DensityBoardProps {
  zones: ZoneOccupancy[];
}

const STATUS_LABEL: Record<ZoneStatus, string> = {
  comfortable: 'Comfortable',
  busy: 'Busy',
  critical: 'Critical',
};

/** Grid of zone density cards for crowd management. */
export function DensityBoard({ zones }: DensityBoardProps): React.JSX.Element {
  return (
    <ul className="density-grid">
      {zones.map((zone) => (
        <li key={zone.id} className="density-card">
          <div className="density-card__head">
            <h3 className="density-card__title">{zone.name}</h3>
            <span className={`status-tag status-tag--${zone.status}`}>
              {STATUS_LABEL[zone.status]}
            </span>
          </div>
          <p className="muted density-card__count">
            {zone.occupancy.toLocaleString()} of {zone.capacity.toLocaleString()} ({zone.densityPct}
            %)
          </p>
          <div
            className="density-bar"
            role="meter"
            aria-valuenow={zone.densityPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${zone.name} occupancy ${String(zone.densityPct)} percent, ${STATUS_LABEL[zone.status]}`}
          >
            <div
              className={`density-bar__fill fill--${zone.status}`}
              style={{ width: `${String(zone.densityPct)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
