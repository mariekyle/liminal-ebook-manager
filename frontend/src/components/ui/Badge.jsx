import { useStatusLabels } from '../../hooks/useStatusLabels'

/**
 * Badge — Status indicators, category labels, metadata chips
 *
 * Types:
 *   status: Unread, In Progress, Finished, DNF (with dot indicator)
 *   category: Fiction, FanFiction, Non-Fiction
 *   chip: fandom, ship, character, tag (for fanfic metadata)
 *
 * Usage:
 *   <Badge status="finished" />
 *   <Badge category="fanfiction" />
 *   <Badge chip="ship" label="Draco/Harry" />
 *   <Badge chip="tag" label="slow burn" />
 */
const STATUS_BACKEND_KEY = {
  unread: 'Unread',
  reading: 'In Progress',
  finished: 'Finished',
  dnf: 'Abandoned',
}

const STATUS_CONFIG = {
  unread: {
    dotColor: 'bg-status-unread',
    bgClass: 'bg-status-unread/20',
    textClass: 'text-text-secondary',
  },
  reading: {
    dotColor: 'bg-status-reading',
    bgClass: 'bg-status-reading/[0.18]',
    textColor: '#85b5b5',
  },
  finished: {
    dotColor: 'bg-status-finished',
    bgClass: 'bg-status-finished/[0.18]',
    textColor: '#9dbd8c',
  },
  dnf: {
    dotColor: 'bg-status-dnf',
    bgClass: 'bg-status-dnf/20',
    textClass: 'text-text-secondary',
  },
}

const CATEGORY_CONFIG = {
  fiction: {
    label: 'Fiction',
    bgClass: 'bg-chip-fiction/[0.18]',
    textColor: '#8db3d4',
  },
  fanfiction: {
    label: 'FanFiction',
    bgClass: 'bg-chip-fanfiction/[0.18]',
    textColor: '#a99ccf',
  },
  nonfiction: {
    label: 'Non-Fiction',
    bgClass: 'bg-chip-nonfiction/[0.18]',
    textColor: '#8dbda8',
  },
}

const CHIP_CONFIG = {
  fandom: { bgClass: 'bg-chip-fandom/15', textColor: '#a99ccf' },
  ship: { bgClass: 'bg-chip-ship/15', textColor: '#cfa0af' },
  character: { bgClass: 'bg-chip-character/15', textColor: '#8dc1cf' },
  tag: { bgClass: 'bg-chip-default/[0.35]', textClass: 'text-text-secondary' },
}

export default function Badge({ status, category, chip, label, className = '' }) {
  const { getLabel } = useStatusLabels()

  // Status badge (with dot indicator)
  if (status) {
    const config = STATUS_CONFIG[status]
    if (!config) return null
    const labelText = getLabel(STATUS_BACKEND_KEY[status] || status)
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${config.bgClass} ${config.textClass || ''} ${className}`}
        style={config.textColor ? { color: config.textColor } : undefined}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dotColor}`} />
        {labelText}
      </span>
    )
  }

  // Category badge
  if (category) {
    const config = CATEGORY_CONFIG[category.toLowerCase()]
    if (!config) return null
    return (
      <span
        className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${config.bgClass} ${className}`}
        style={{ color: config.textColor }}
      >
        {config.label}
      </span>
    )
  }

  // Metadata chip
  if (chip && label) {
    const config = CHIP_CONFIG[chip] || CHIP_CONFIG.tag
    return (
      <span
        className={`inline-flex items-center text-xs px-2.5 py-1 rounded-lg whitespace-nowrap ${config.bgClass} ${config.textClass || ''} ${className}`}
        style={config.textColor ? { color: config.textColor } : undefined}
      >
        {label}
      </span>
    )
  }

  return null
}

