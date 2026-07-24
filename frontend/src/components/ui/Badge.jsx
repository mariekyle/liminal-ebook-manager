/**
 * Badge — non-interactive display pill for ambient metadata.
 * Rebuilt on tokens in S4 (v0.81.0) — zero inline styles, class strings
 * are full literals for the Tailwind scanner.
 *
 * Variants (visual treatment; required):
 *   solid   — filled semantic color, medium weight (result pills, priority overlay)
 *   tint    — translucent fill + matching text + faint border (format badges,
 *             match pills, cover-source pill)
 *   outline — neutral: bg-base fill + default border (category chip)
 *   muted   — neutral: elevated fill, muted text (type badges, unknown-format fallback)
 *
 * Props:
 *   tone      — color family for solid/tint; ignored by outline/muted.
 *               solid: success | primary | danger | warning
 *               tint:  warning | fiction | fanfiction | nonfiction | fandom | character
 *   size      — sm (caption, px-2 py-0.5) | md (caption, px-2.5 py-1)
 *               | lg (body-sm, px-3 py-1.5). Default md.
 *   pill      — true (rounded-full, default) | false (rounded)
 *   title     — native tooltip passthrough
 *   className — LAYOUT ONLY (positioning/spacing — Button's contract)
 *
 * Unknown variant — or solid/tint without a known tone — renders null,
 * matching the old Badge's unknown-mode behavior.
 *
 * No status mode: reading-status rendering lives in BookCard/AcquireCard.
 * If a status mode is ever added here, its labels MUST route through
 * useStatusLabels (never a hardcoded "Abandoned"/"DNF").
 *
 * Usage:
 *   <Badge variant="solid" tone="success" size="sm" pill={false}>NEW</Badge>
 *   <Badge variant="tint" tone="fiction" size="md" title="EPUB edition">EPUB</Badge>
 *   <Badge variant="outline" size="lg">Fiction</Badge>
 *   <Badge variant="muted" size="sm" pill={false}>Checklist</Badge>
 */
const SOLID_TONES = {
  success: 'bg-action-success text-text-primary',
  primary: 'bg-action-primary text-text-primary',
  danger: 'bg-action-danger text-text-primary',
  warning: 'bg-action-warning text-text-inverse',
}

const TINT_TONES = {
  warning: 'bg-action-warning/20 text-action-warning border border-action-warning/30',
  fiction: 'bg-chip-fiction/20 text-chip-fiction border border-chip-fiction/30',
  fanfiction: 'bg-chip-fanfiction/20 text-chip-fanfiction border border-chip-fanfiction/30',
  nonfiction: 'bg-chip-nonfiction/20 text-chip-nonfiction border border-chip-nonfiction/30',
  fandom: 'bg-chip-fandom/20 text-chip-fandom border border-chip-fandom/30',
  character: 'bg-chip-character/20 text-chip-character border border-chip-character/30',
}

const SIZES = {
  sm: 'text-caption px-2 py-0.5',
  md: 'text-caption px-2.5 py-1',
  lg: 'text-body-sm px-3 py-1.5',
}

export default function Badge({
  children,
  variant,
  tone,
  size = 'md',
  pill = true,
  title,
  className = '',
}) {
  let treatment
  if (variant === 'solid') {
    treatment = SOLID_TONES[tone] && `${SOLID_TONES[tone]} font-medium`
  } else if (variant === 'tint') {
    treatment = TINT_TONES[tone] && `${TINT_TONES[tone]} font-medium`
  } else if (variant === 'outline') {
    treatment = 'bg-bg-base border border-border-default text-text-body'
  } else if (variant === 'muted') {
    treatment = 'bg-bg-elevated/80 text-text-muted'
  }

  if (!treatment) return null

  return (
    <span
      title={title}
      className={`inline-flex items-center whitespace-nowrap ${SIZES[size] || SIZES.md} ${
        pill ? 'rounded-full' : 'rounded'
      } ${treatment} ${className}`}
    >
      {children}
    </span>
  )
}
