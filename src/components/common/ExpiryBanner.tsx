import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { getExpiryAlerts, type ExpiryAlert, type ExpiryStatus } from '../../utils/expiryChecker';
import type { PantryItem } from '../../types/database';
import { Link } from 'react-router-dom';

interface ExpiryBannerProps {
  items: PantryItem[];
  /** When true, banner is hidden for this session (dismissed). */
  dismissed?: boolean;
  onDismiss?: () => void;
}

function statusStyles(status: ExpiryStatus): string {
  switch (status) {
    case 'expired':
      return 'bg-red-50 border-red-500 text-red-800';
    case 'today':
      return 'bg-orange-50 border-orange-500 text-orange-800';
    case 'soon':
      return 'bg-yellow-50 border-yellow-500 text-yellow-800';
    default:
      return 'bg-gray-50 border-gray-300 text-gray-700';
  }
}

function statusBadge(status: ExpiryStatus): string {
  switch (status) {
    case 'expired':
      return 'bg-red-200 text-red-800';
    case 'today':
      return 'bg-orange-200 text-orange-800';
    case 'soon':
      return 'bg-yellow-200 text-yellow-800';
    default:
      return 'bg-gray-200 text-gray-700';
  }
}

function formatExpiryDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function ExpiryBanner({ items, dismissed = false, onDismiss }: ExpiryBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissedLocal, setDismissedLocal] = useState(false);

  const alerts = getExpiryAlerts(items);
  const isDismissed = dismissed || dismissedLocal;

  if (alerts.length === 0 || isDismissed) return null;

  const borderClass =
    alerts[0].status === 'expired'
      ? 'border-red-500'
      : alerts[0].status === 'today'
        ? 'border-orange-500'
        : 'border-yellow-500';
  const bgClass =
    alerts[0].status === 'expired'
      ? 'bg-red-50'
      : alerts[0].status === 'today'
        ? 'bg-orange-50'
        : 'bg-yellow-50';

  return (
    <div
      className={`rounded-lg border-2 ${borderClass} ${bgClass} shadow-sm overflow-hidden mb-4`}
      role="region"
      aria-label="Expiring items"
    >
      <div className="p-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 flex-1 text-left font-medium hover:opacity-90"
        >
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>
            {alerts.length} item{alerts.length !== 1 ? 's' : ''} expiring soon
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 shrink-0 ml-1" />
          ) : (
            <ChevronDown className="w-4 h-4 shrink-0 ml-1" />
          )}
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/pantry" className="text-sm font-medium underline hover:no-underline">
            View in Pantry
          </Link>
          <button
            type="button"
            onClick={() => {
              onDismiss?.();
              setDismissedLocal(true);
            }}
            className="p-1 rounded hover:bg-black/10"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {expanded && (
        <ul className="border-t border-current/20 divide-y divide-current/10 max-h-48 overflow-y-auto">
          {alerts.map((alert: ExpiryAlert) => (
            <li
              key={alert.item.id}
              className={`px-3 py-2 flex items-center justify-between gap-2 text-sm ${statusStyles(alert.status)}`}
            >
              <span className="font-medium truncate">{alert.item.name}</span>
              <span className="shrink-0 text-xs opacity-90">
                {formatExpiryDate(alert.item.expiry_date ?? '')}
              </span>
              <span
                className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium capitalize ${statusBadge(alert.status)}`}
              >
                {alert.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
