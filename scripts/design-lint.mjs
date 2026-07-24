#!/usr/bin/env node
/**
 * design-lint.mjs — Liminal design-system lint (S13 guardrail).
 *
 * Plain Node, zero dependencies. Scans frontend/src/**\/*.{jsx,js,css} against
 * the design-system rules locked in docs/FRONTEND_AUDIT_S12.md (Appendix A) and
 * CLAUDE.md, and refreshes docs/DESIGN_LINT_REPORT.md whenever its content
 * changes (unchanged runs leave the file untouched, keeping git status clean).
 *
 * Usage:
 *   node scripts/design-lint.mjs          # exits 1 on strict violations (CI-style)
 *   node scripts/design-lint.mjs --warn   # always exits 0 (pre-commit hook mode)
 *
 * Counting rules (per FRONTEND_AUDIT_S12.md §0, one deviation noted):
 *   - An instance is one regex match (occurrence-level), not one line.
 *   - Comments/JSDoc are stripped before matching (S16 C1 — deviation from the
 *     audit's "counts include comments"): a `<button` or hex in prose is not a
 *     violation, and commented-out code never counts. `design-lint-ignore`
 *     markers are still read from the original, unstripped source.
 *   - Variant prefixes (hover:, focus:, md:) are part of the same instance.
 *
 * Exception mechanics:
 *   - Whole-file: the six frozen files (FROZEN_FILES below) are excluded entirely.
 *   - Line-level: `// design-lint-ignore` on the same line or the line immediately
 *     above suppresses that line for all categories. `/* design-lint-ignore *\/`
 *     works the same way in CSS.
 *   - Block-level (CSS only): a `design-lint-hex-sanctioned-start` /
 *     `design-lint-hex-sanctioned-end` comment pair exempts the enclosed lines
 *     from the A6 unbracketed-hex pattern ONLY (index.css's token mirror);
 *     every other category still applies inside the block.
 *   - Multi-line className values are anchored to the line of `className=`;
 *     an ignore for them must sit on or directly above that line, not beside
 *     the offending class deeper inside the expression.
 *
 * Known static-lint limitations (documented, not bugs):
 *   - className={someVariable} and dynamically assembled class strings are
 *     invisible to the pairing checks (cascade-flip, font-bold); plain-text
 *     categories still match wherever the literal appears.
 *   - Inline style objects (e.g. fontWeight: 700) are not class usage and are
 *     not checked.
 *   - Props like labelClassName= are scanned too (the matcher keys on the
 *     `className=` suffix) — intentional: forwarded class props reach the DOM.
 *   - Regex literals are not tracked — they can confuse the brace scanner, and
 *     the comment stripper reads an unescaped `//` inside one as a line
 *     comment (escaped `\/\/` is handled). Comments inside braces are handled.
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..')
const SRC_ROOT = path.join(REPO_ROOT, 'frontend', 'src')
const REPORT_PATH = path.join(REPO_ROOT, 'docs', 'DESIGN_LINT_REPORT.md')
const UI_DIR = 'frontend/src/components/ui/'
const IGNORE_TOKEN = 'design-lint-ignore'
const WARN_MODE = process.argv.includes('--warn')

// Canonical frozen list lives in CLAUDE.md — this is a derived copy. If they disagree, CLAUDE.md wins; update this.
const FROZEN_FILES = [
  'frontend/src/components/GradientCover.jsx',
  'frontend/src/components/MosaicCover.jsx',
  'frontend/src/components/upload/BookCard.jsx',
  'backend/services/covers.py',
  'backend/services/metadata.py',
  'backend/database.py',
]

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

// Category A sub-patterns, taken verbatim from FRONTEND_AUDIT_S12.md Appendix A.
const HARDCODED_COLOR_PATTERNS = [
  ['A1', /(?<![\w-])text-white(?![\w-])/g],
  ['A2', /(?<![\w-])(?:text|bg|border)-gray-\d{2,3}(?![\w-])/g],
  ['A3', /(?<![\w-])[a-z][\w-]*-(?:zinc|slate)-\d{2,3}(?![\w-])/g],
  ['A4', /\[#[0-9a-fA-F]{3,8}\]/g],
  ['A5', /(?<![\w-])(?:text|bg|border|ring)-(?:indigo|red|green|blue|yellow)-\d{2,3}(?![\w-])/g],
]

// A6 (C2 hex rescope, ratified 2026-07-20): unbracketed hex, scoped to where a
// hex is styling rather than data — className string values, SVG stroke=/fill=
// attributes, and CSS declarations. Inline-style objects and generation-data
// constants (gradient lanes, chip colors, cover fallbacks) stay OUT of lint
// scope: code-reviewer judgment. Exact lengths (8|6|4|3) keep hex-shaped id
// selectors and partial words from matching; A4 owns the bracketed form.
const UNBRACKETED_HEX = /(?<![[\w#])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F\w-])/g
const SVG_HEX_ATTR = /(?<![\w-])(?:stroke|fill)\s*=\s*["']#[0-9a-fA-F]{3,8}["']/g
// CSS-only sanction markers: lines between the pair are exempt from
// UNBRACKETED_HEX (index.css's token mirror — base styles and scrollbar
// pseudo-elements can't take utility classes). Read from the original source,
// like ignore markers. An unpaired start marker sanctions nothing — fail loud.
const HEX_SANCTION_START = 'design-lint-hex-sanctioned-start'
const HEX_SANCTION_END = 'design-lint-hex-sanctioned-end'

// Legacy library-* alias utilities (deleted from tailwind.config.js in v0.48.0).
const LIBRARY_ALIAS = /(?<![\w-])(?:[a-z][\w-]*:)*[a-z][\w-]*-library-[\w-]+(?![\w-])/g

// Any indigo-* utility class (class-shaped on purpose: prose/comment mentions of
// the word "indigo" do not match — see SeriesCard.jsx:26).
const INDIGO_UTILITY = /(?<![\w-])(?:[a-z][\w-]*:)*(?:[a-z][\w-]*-)?indigo-(?:\d{2,3}|\[[^\]]*\])(?![\w-])/g

// text-h1 no longer exists (fontSize key deleted, S13) — any occurrence is an
// error, including a re-added CSS definition, so no dot-exclusion here.
const TEXT_H1 = /(?<![\w-])text-h1(?![\w-])/g

// window.confirm() under either spelling — bare confirm() is the same function
// and evaded the rule from S13 until S16 C1. The lookbehind keeps
// showConfirm()/dialog.confirm() out; the window. prefix stays optional.
const WINDOW_CONFIRM = /(?<![\w.$])(?:window\.)?confirm\(/g

// Bare or window-qualified alert() calls — same no-silent-failures rule as
// window.confirm. \b keeps showAlert()/customAlert() out; window.alert()
// still matches (the dot is a word boundary).
const ALERT_CALL = /\balert\(/g

// "Abandoned" / "Did Not Finish" as rendered UI copy. DB-value constants
// (comparisons, map keys, getLabel() arguments) deliberately do not match.
// The render-fallback shape is conservative on purpose — `x || 'Abandoned'`
// flags even when x is an internal value, because exactly that shape produced
// the audit's H3 #2 rendered-label bug; add a design-lint-ignore if a
// legitimate internal fallback ever needs it.
const STATUS_LABEL_LITERALS = [
  ['jsx-text', />\s*(?:Abandoned|Did Not Finish)\s*</g],
  ['label-literal', /label\s*[:=]\s*['"`](?:Abandoned|Did Not Finish)['"`]/g],
  ['render-fallback', /\|\|\s*['"`](?:Abandoned|Did Not Finish)['"`]/g],
]

// Typography token classes (text-h1 handled by its own category above).
const TOKEN_CLASS = /(?<![\w.-])text-(?:h[2-4]|body(?:-sm)?|caption|label)(?![\w-])/
// Core Tailwind sizes text-xs–text-3xl (variant prefixes allowed).
const CORE_SIZE = /(?<![\w-])(?:[a-z][\w-]*:)*text-(?:xs|sm|base|lg|xl|2xl|3xl)(?![\w-])/
const FONT_BOLD = /(?<![\w-])(?:[a-z][\w-]*:)*font-bold(?![\w-])/

const RAW_BUTTON = /<button\b/g

// Raw-button rescope + strict flip (S4b, ratified 2026-07-23).
//
// A <button> occurrence outside ui//frozen is EXEMPT from the count iff:
//   1. its opening tag carries role="option" (an option row in a combobox
//      dropdown — WishlistForm, AuthorChips, TagsMultiSelect,
//      UnifiedEditModal), OR
//   2. it is structurally a tappable CONTENT SURFACE, all four holding:
//      a. no bare text at direct-child depth (every non-whitespace char
//         sits inside an element subtree or a {...} expression),
//      b. >= 1 direct child element that is not icon/label chrome
//         anatomy: tags svg and span never qualify, and neither does a
//         component tag matching /Icon$/ (DotsIcon, ChevronUpIcon,
//         DragHandleIcon — the codebase's glyph-component convention);
//         div, img, and other Uppercase component tags qualify,
//      c. no nested <button> at any depth (a button inside a button is
//         the SortDropdown defect — invalid HTML never exempts),
//      d. the button closes properly in-file.
//   {...} expression children are neutral: permitted, never qualifying.
//
// Everything still counted is chrome and must carry an explicit marker:
//   design-lint-button-chrome: <annotation>
// in a comment on the same line as <button or the line directly above.
// The annotation is REQUIRED — a bare marker suppresses nothing. Markers
// suppress ONLY this category (design-lint-ignore stays all-category)
// and are inventoried in the report so exceptions stay visible.
const BUTTON_CHROME_TOKEN = 'design-lint-button-chrome'
const ROLE_OPTION = /role\s*=\s*["']option["']/

const CATEGORIES = [
  { key: 'hardcoded-colors', label: 'Hardcoded colors (A1–A6)', strict: true },
  { key: 'library-alias', label: 'Legacy library-* alias classes', strict: true },
  { key: 'indigo', label: 'Indigo utility classes', strict: true },
  { key: 'cascade-flip', label: 'Cascade-flip pairing (token + core size)', strict: true },
  { key: 'window-confirm', label: 'window.confirm() / bare confirm()', strict: true },
  { key: 'alert-call', label: 'alert() calls', strict: true },
  { key: 'status-label-literal', label: '"Abandoned" / "Did Not Finish" in UI copy', strict: true },
  { key: 'font-bold', label: 'font-bold on headings / with token classes', strict: true },
  { key: 'text-h1', label: 'text-h1 (class no longer exists)', strict: true },
  { key: 'raw-button', label: 'Raw <button> outside components/ui/ (unmarked, unrescoped)', strict: true },
]

// ---------------------------------------------------------------------------
// File walking
// ---------------------------------------------------------------------------

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build'])
const EXTENSIONS = new Set(['.jsx', '.js', '.css'])

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, out)
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      out.push(full)
    }
  }
  return out
}

function relPath(abs) {
  return path.relative(REPO_ROOT, abs).split(path.sep).join('/')
}

// ---------------------------------------------------------------------------
// Per-file scanning
// ---------------------------------------------------------------------------

function lineStarts(text) {
  const starts = [0]
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') starts.push(i + 1)
  }
  return starts
}

function lineAt(starts, offset) {
  let lo = 0
  let hi = starts.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (starts[mid] <= offset) lo = mid
    else hi = mid - 1
  }
  return lo + 1 // 1-indexed
}

/**
 * Scans a brace-delimited JSX expression starting at text[start] === '{'.
 * Quote/backtick-aware (including ${...} inside template literals) and skips
 * // and block comments so a quote inside a comment can't open a phantom
 * string state. Returns the offset of the closing '}' or -1.
 */
function scanBraced(text, start) {
  const stack = ['{']
  for (let i = start + 1; i < text.length; i++) {
    const c = text[i]
    const top = stack[stack.length - 1]
    if (top === '"' || top === "'") {
      if (c === '\\') i++
      else if (c === top) stack.pop()
    } else if (top === '`') {
      if (c === '\\') i++
      else if (c === '`') stack.pop()
      else if (c === '$' && text[i + 1] === '{') { stack.push('{'); i++ }
    } else {
      if (c === '/' && text[i + 1] === '/') {
        const nl = text.indexOf('\n', i)
        if (nl === -1) return -1
        i = nl
      } else if (c === '/' && text[i + 1] === '*') {
        const end = text.indexOf('*/', i + 2)
        if (end === -1) return -1
        i = end + 1
      } else if (c === '"' || c === "'" || c === '`') stack.push(c)
      else if (c === '{') stack.push('{')
      else if (c === '}') {
        stack.pop()
        if (stack.length === 0) return i
      }
    }
  }
  return -1
}

/** Yields { value, offset } for every className attribute value in JSX/JS text. */
function* classNameValues(text) {
  const re = /className\s*=\s*/g
  let m
  while ((m = re.exec(text)) !== null) {
    const at = re.lastIndex
    const c = text[at]
    if (c === '"' || c === "'") {
      const end = text.indexOf(c, at + 1)
      if (end === -1) continue
      yield { value: text.slice(at + 1, end), offset: m.index }
      re.lastIndex = end + 1
    } else if (c === '{') {
      const end = scanBraced(text, at)
      if (end === -1) continue
      yield { value: text.slice(at + 1, end), offset: m.index }
      re.lastIndex = end + 1
    }
  }
}

/** Yields { tag, offset } source text of every <h1>–<h6> opening tag. */
function* headingTags(text) {
  const re = /<h[1-6](?=[\s/>])/g
  let m
  while ((m = re.exec(text)) !== null) {
    // Walk to the tag-closing '>' honoring braced attribute expressions
    // (arrow functions etc. contain '>' inside braces).
    let i = m.index + m[0].length
    for (; i < text.length; i++) {
      const c = text[i]
      if (c === '{') {
        const end = scanBraced(text, i)
        if (end === -1) break
        i = end
      } else if (c === '"' || c === "'") {
        const end = text.indexOf(c, i + 1)
        if (end === -1) break
        i = end
      } else if (c === '>') {
        yield { tag: text.slice(m.index, i + 1), offset: m.index }
        break
      }
    }
  }
}

/**
 * Walks from `<` at `start` to the `>` that closes the opening tag, honoring
 * braced attribute expressions and quoted strings (same walk headingTags
 * uses). Returns the offset of `>` or -1.
 */
function tagEnd(text, start) {
  for (let i = start + 1; i < text.length; i++) {
    const c = text[i]
    if (c === '{') {
      const end = scanBraced(text, i)
      if (end === -1) return -1
      i = end
    } else if (c === '"' || c === "'") {
      const end = text.indexOf(c, i + 1)
      if (end === -1) return -1
      i = end
    } else if (c === '>') return i
  }
  return -1
}

/**
 * Classifies one `<button` occurrence (offset of `<`) against the S4b
 * exemption test documented at BUTTON_CHROME_TOKEN above. Returns
 * { exempt, end } — end is the offset just past the matching </button>
 * (-1 when malformed/unterminated), used by the caller's containment
 * check: a button nested inside another button never exempts, in either
 * direction. Anything malformed or ambiguous counts (errs toward visible).
 */
function classifyButton(text, start) {
  const openEnd = tagEnd(text, start)
  if (openEnd === -1) return { exempt: false, end: -1 }
  const openTag = text.slice(start, openEnd + 1)
  const roleOption = ROLE_OPTION.test(openTag)
  if (text[openEnd - 1] === '/') return { exempt: roleOption, end: openEnd + 1 }

  let i = openEnd + 1
  let depth = 0
  let bareText = false
  let qualifying = 0
  let nestedButton = false
  while (i < text.length) {
    const c = text[i]
    if (c === '<') {
      if (text.startsWith('</', i)) {
        const close = text.indexOf('>', i)
        if (close === -1) return { exempt: false, end: -1 }
        if (depth === 0) {
          if (text.slice(i + 2, close).trim() !== 'button') return { exempt: false, end: -1 }
          return {
            exempt: (roleOption || (!bareText && qualifying > 0)) && !nestedButton,
            end: close + 1,
          }
        }
        depth--
        i = close + 1
        continue
      }
      const m = /^<([A-Za-z][\w.]*)/.exec(text.slice(i, i + 80))
      if (!m) {
        i++ // stray '<' (comparison inside text) — not an element
        continue
      }
      if (m[1] === 'button') nestedButton = true
      const end = tagEnd(text, i)
      if (end === -1) return { exempt: false, end: -1 }
      if (depth === 0 && m[1] !== 'svg' && m[1] !== 'span' && !/Icon$/.test(m[1])) qualifying++
      if (text[end - 1] !== '/') depth++
      i = end + 1
      continue
    }
    if (c === '{' && depth === 0) {
      const end = scanBraced(text, i)
      if (end === -1) return { exempt: false, end: -1 }
      i = end + 1
      continue
    }
    if (depth === 0 && !/\s/.test(c)) bareText = true
    i++
  }
  return { exempt: false, end: -1 } // never closed
}

/**
 * Replaces comment bodies with spaces so matchers never count commented-out
 * code or prose (e.g. a `<button` inside JSDoc). Newlines inside comments are
 * kept, so every offset and line number in the stripped text matches the
 * source exactly. String/template-literal aware (including ${...} nesting);
 * CSS strips block comments only (`//` inside url() is not a comment). An
 * unescaped `//` inside a regex literal reads as a line comment — documented
 * limitation (escaped `\/\/` is handled via the backslash guard).
 */
function stripComments(text, isCss) {
  const out = text.split('')
  const blank = (from, to) => {
    for (let i = from; i < to; i++) if (out[i] !== '\n') out[i] = ' '
  }
  const stack = [] // '"' | "'" | '`' string states; '{' = ${...} interpolation
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    const top = stack[stack.length - 1]
    if (top === '"' || top === "'") {
      if (c === '\\') i++
      else if (c === top || c === '\n') stack.pop()
    } else if (top === '`') {
      if (c === '\\') i++
      else if (c === '`') stack.pop()
      else if (c === '$' && text[i + 1] === '{') { stack.push('{'); i++ }
    } else {
      // Code context — either top-level or inside a template's ${...}
      if (!isCss && c === '/' && text[i + 1] === '/' && text[i - 1] !== '\\') {
        let end = text.indexOf('\n', i)
        if (end === -1) end = text.length
        blank(i, end)
        i = end - 1
      } else if (c === '/' && text[i + 1] === '*') {
        let end = text.indexOf('*/', i + 2)
        end = end === -1 ? text.length : end + 2
        blank(i, end)
        i = end - 1
      } else if (!isCss && (c === '"' || c === "'" || c === '`')) {
        stack.push(c)
      } else if (top === '{') {
        if (c === '{') stack.push('{')
        else if (c === '}') stack.pop()
      }
    }
  }
  return out.join('')
}

function scanFile(abs, ctx) {
  const rel = relPath(abs)
  const text = fs.readFileSync(abs, 'utf8')
  const starts = lineStarts(text)
  const lines = text.split('\n')
  const isCss = abs.endsWith('.css')
  // Matchers run against comment-stripped text; the ignore scan below stays on
  // the original source (design-lint-ignore markers live in comments).
  const stripped = stripComments(text, isCss)

  // Line-level ignores: the ignore line itself and the line below it.
  const suppressed = new Set()
  lines.forEach((line, i) => {
    if (line.includes(IGNORE_TOKEN)) {
      suppressed.add(i + 1)
      suppressed.add(i + 2)
      ctx.ignores.push({ file: rel, line: i + 1, text: line.trim() })
    }
  })

  // Chrome markers (raw-button only): annotation is required — a bare
  // marker suppresses nothing, so every exception carries its reason.
  // Read from original source like ignores; markers live in comments.
  const chromeMarks = new Map()
  lines.forEach((line, i) => {
    const at = line.indexOf(BUTTON_CHROME_TOKEN)
    if (at === -1) return
    const annotation = line
      .slice(at + BUTTON_CHROME_TOKEN.length)
      .replace(/^[:\s]+/, '')
      .replace(/\*\/.*$/, '')
      .replace(/}}?\s*$/, '')
      .trim()
    chromeMarks.set(i + 1, annotation)
    ctx.chromeMarkers.push({ file: rel, line: i + 1, annotation })
  })

  const add = (category, offset, matched, detail = '') => {
    const line = lineAt(starts, offset)
    if (suppressed.has(line)) return
    // Collapse whitespace: multi-line matches (heading tags) must not carry
    // raw newlines into the report's markdown table rows.
    ctx.violations.push({ file: rel, line, category, matched: matched.replace(/\s+/g, ' '), detail })
  }

  const runPattern = (category, regex, detail = '') => {
    regex.lastIndex = 0
    let m
    while ((m = regex.exec(stripped)) !== null) add(category, m.index, m[0], detail)
  }

  // Plain-text categories (JSX/JS and CSS alike)
  for (const [sub, regex] of HARDCODED_COLOR_PATTERNS) runPattern('hardcoded-colors', regex, sub)
  runPattern('library-alias', LIBRARY_ALIAS)
  runPattern('indigo', INDIGO_UTILITY)
  runPattern('text-h1', TEXT_H1)

  if (isCss) {
    // A6 in CSS: any unbracketed hex declaration, minus sanctioned blocks.
    const sanctioned = []
    let openLine = null
    lines.forEach((line, i) => {
      if (line.includes(HEX_SANCTION_START)) openLine = i + 1
      else if (line.includes(HEX_SANCTION_END) && openLine !== null) {
        sanctioned.push([openLine, i + 1])
        openLine = null
      }
    })
    UNBRACKETED_HEX.lastIndex = 0
    let m
    while ((m = UNBRACKETED_HEX.exec(stripped)) !== null) {
      const line = lineAt(starts, m.index)
      if (sanctioned.some(([from, to]) => line >= from && line <= to)) continue
      add('hardcoded-colors', m.index, m[0], 'A6 css')
    }
    return
  }

  // JSX/JS-only categories
  runPattern('window-confirm', WINDOW_CONFIRM)
  runPattern('alert-call', ALERT_CALL)
  for (const [sub, regex] of STATUS_LABEL_LITERALS) runPattern('status-label-literal', regex, sub)
  runPattern('hardcoded-colors', SVG_HEX_ATTR, 'A6 stroke/fill')

  // className-aware categories
  for (const { value, offset } of classNameValues(stripped)) {
    if (TOKEN_CLASS.test(value) && CORE_SIZE.test(value)) {
      add('cascade-flip', offset, `${value.match(TOKEN_CLASS)[0]} + ${value.match(CORE_SIZE)[0]}`, 'one className')
    }
    if (FONT_BOLD.test(value) && TOKEN_CLASS.test(value)) {
      add('font-bold', offset, `font-bold + ${value.match(TOKEN_CLASS)[0]}`, 'with token class')
    }
    UNBRACKETED_HEX.lastIndex = 0
    const hexHits = value.match(UNBRACKETED_HEX)
    if (hexHits) add('hardcoded-colors', offset, hexHits.join(' '), 'A6 className')
  }
  for (const { tag, offset } of headingTags(stripped)) {
    if (FONT_BOLD.test(tag)) {
      add('font-bold', offset, tag.length > 80 ? `${tag.slice(0, 77)}...` : tag, 'on heading element')
    }
  }

  // Raw <button> outside components/ui/ — strict since S4b. Each match is
  // classified (content surface / option row → exempt) and the remainder
  // must carry an annotated chrome marker on its line or the line above.
  // Nesting kills exemption in BOTH directions: neither the wrapper nor
  // the wrapped button of invalid nesting is ever structurally exempt.
  if (!rel.startsWith(UI_DIR)) {
    RAW_BUTTON.lastIndex = 0
    const sites = []
    let m
    while ((m = RAW_BUTTON.exec(stripped)) !== null) {
      sites.push({ off: m.index, ...classifyButton(stripped, m.index) })
    }
    for (const s of sites) {
      const nestedInside = sites.some(
        (o) => o !== s && o.end !== -1 && s.off > o.off && s.off < o.end
      )
      if (s.exempt && !nestedInside) continue
      const line = lineAt(starts, s.off)
      const mark = chromeMarks.get(line) ?? chromeMarks.get(line - 1)
      if (mark !== undefined && mark !== '') continue // annotated chrome
      add('raw-button', s.off, '<button', mark === '' ? 'marker missing annotation' : 'unmarked')
    }
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const allFiles = walk(SRC_ROOT)
const frozenSet = new Set(FROZEN_FILES)
const scanned = allFiles.filter((f) => !frozenSet.has(relPath(f)))
const frozenExcluded = allFiles.length - scanned.length

const ctx = { violations: [], ignores: [], chromeMarkers: [] }
for (const file of scanned.sort()) scanFile(file, ctx)
ctx.violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)

const counts = Object.fromEntries(CATEGORIES.map((c) => [c.key, 0]))
for (const v of ctx.violations) counts[v.category]++
const strictTotal = CATEGORIES.filter((c) => c.strict).reduce((sum, c) => sum + counts[c.key], 0)

// ---------------------------------------------------------------------------
// Report (docs/DESIGN_LINT_REPORT.md — content-aware: rewritten only when the
// content changes, so clean runs never dirty the working tree)
// ---------------------------------------------------------------------------

// Date-only on purpose: the stamp records when the report last materially
// changed. A time-of-day stamp would make every run a new file and defeat
// the unchanged-skip below.
const now = new Date().toISOString().slice(0, 10)
const summaryRows = CATEGORIES.map((c) => {
  const count = counts[c.key]
  const target = c.strict ? '0' : '— (report-only)'
  const status = c.strict ? (count === 0 ? '✅ pass' : '❌ FAIL') : 'ℹ️ counted'
  return `| ${c.label} | ${c.strict ? 'strict' : 'report-only'} | ${count} | ${target} | ${status} |`
})

const violationSection = ctx.violations.length
  ? [
      '| File:line | Category | Matched |',
      '|-----------|----------|---------|',
      ...ctx.violations.map(
        (v) =>
          `| ${v.file}:${v.line} | ${v.category}${v.detail ? ` (${v.detail})` : ''} | \`${v.matched.replace(/\|/g, '\\|').replace(/`/g, "'")}\` |`
      ),
    ].join('\n')
  : '_None._'

const ignoreSection = ctx.ignores.length
  ? [
      '| File:line | Ignore comment |',
      '|-----------|----------------|',
      ...ctx.ignores.map((i) => `| ${i.file}:${i.line} | \`${i.text.replace(/\|/g, '\\|').replace(/`/g, "'")}\` |`),
    ].join('\n')
  : '_None. No line-level exceptions are currently in effect._'

const chromeSection = ctx.chromeMarkers.length
  ? [
      '| File:line | Annotation |',
      '|-----------|------------|',
      ...ctx.chromeMarkers.map(
        (c) =>
          `| ${c.file}:${c.line} | ${c.annotation ? c.annotation.replace(/\|/g, '\\|') : '**MISSING — marker suppresses nothing**'} |`
      ),
    ].join('\n')
  : '_None._'

const report = `# Design Lint Report

> Generated by \`scripts/design-lint.mjs\` — do not edit by hand. Regenerated whenever counts, violations, or ignores change (runs that change nothing leave the file untouched); the pre-commit hook refreshes and stages it.

**Run date:** ${now} (date of last content change)
**Scope:** \`frontend/src/**/*.{jsx,js,css}\` — ${scanned.length} files scanned, ${frozenExcluded} frozen file(s) excluded (audit scope per docs/FRONTEND_AUDIT_S12.md; canonical frozen list in CLAUDE.md).
**Strict violations:** ${strictTotal}

## Category summary

| Category | Severity | Count | Target | Status |
|----------|----------|-------|--------|--------|
${summaryRows.join('\n')}

Raw \`<button>\` is **strict** as of S4b (v0.82.0): a \`<button>\` outside \`components/ui/\` counts unless it is a content surface (element children, no bare text, no svg/span-only anatomy, no nested button) or an option row (\`role="option"\`), or carries an annotated \`design-lint-button-chrome\` marker. The conversion backlog cleared in the adoption sprint (S1–S4b).

## Violations

${violationSection}

## Active-ignores inventory

Every \`design-lint-ignore\` in the scanned scope, so exceptions stay visible instead of rotting silently:

${ignoreSection}

## Chrome-marker inventory

Every \`design-lint-button-chrome\` marker in the scanned scope — the sanctioned raw-button exceptions, each carrying its reason:

${chromeSection}
`

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true })
// Skip the write when the report matches what's on disk apart from the
// run-date line — keeps a clean tree clean across commits.
const stripRunDate = (s) => s.replace(/^\*\*Run date:\*\*.*$/m, '')
const existing = fs.existsSync(REPORT_PATH) ? fs.readFileSync(REPORT_PATH, 'utf8') : null
const reportUnchanged = existing !== null && stripRunDate(existing) === stripRunDate(report)
if (!reportUnchanged) fs.writeFileSync(REPORT_PATH, report)

// ---------------------------------------------------------------------------
// Console summary
// ---------------------------------------------------------------------------

console.log('design-lint — category summary')
for (const c of CATEGORIES) {
  const count = counts[c.key]
  const flag = c.strict ? (count === 0 ? 'pass' : 'FAIL') : 'report-only'
  console.log(`  ${String(count).padStart(4)}  ${c.label}  [${flag}]`)
}
if (strictTotal > 0) {
  console.log('\nStrict violations:')
  for (const v of ctx.violations) {
    if (CATEGORIES.find((c) => c.key === v.category)?.strict) {
      console.log(`  ${v.file}:${v.line}  ${v.category}  ${v.matched}`)
    }
  }
}
console.log(
  reportUnchanged
    ? `\nReport unchanged — ${relPath(REPORT_PATH)} left untouched`
    : `\nReport written to ${relPath(REPORT_PATH)}`
)

if (strictTotal > 0 && !WARN_MODE) {
  console.error(`design-lint: ${strictTotal} strict violation(s).`)
  process.exit(1)
}
process.exit(0)
