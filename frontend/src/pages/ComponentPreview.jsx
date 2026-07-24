import { useState, useEffect } from 'react'

import Button from '../components/ui/Button'
import IconButton from '../components/ui/IconButton'
import Badge from '../components/ui/Badge'
import SearchInput from '../components/ui/SearchInput'
import FormField from '../components/ui/FormField'
import StarRating from '../components/ui/StarRating'
import Modal from '../components/ui/Modal'
import Toast from '../components/ui/Toast'
import UnifiedNavBar from '../components/ui/UnifiedNavBar'
import AuthorInput from '../components/ui/AuthorInput'
import ChipInput from '../components/ui/ChipInput'
import FileDropZone from '../components/ui/FileDropZone'
import SegmentedControl from '../components/ui/SegmentedControl'
import MenuItem from '../components/ui/MenuItem'
import ThreeDotMenu from '../components/ui/ThreeDotMenu'

/* Preview icons — same strokes as lucide-react Pencil, Trash2, Plus, Settings, X. Run `npm i lucide-react` and swap imports if you prefer. */
function PrevPencil(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}
function PrevTrash2(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  )
}
function PrevPlus(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
function PrevSettings(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function PrevX(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

/* Mirrors ManualEntryForm's CATEGORY_OPTIONS shape (minus Uncategorized) —
   the canonical SegmentedControl use is the category picker. */
const DEMO_CATEGORY_OPTIONS = [
  { value: 'Fiction', label: 'Fiction' },
  { value: 'Non-Fiction', label: 'Non-Fiction' },
  { value: 'FanFiction', label: 'FanFiction' },
]

function Section({ title, children }) {
  return (
    <section className="py-8 border-b border-border-default">
      <h2 className="text-h4 text-text-primary mb-6">{title}</h2>
      <div className="bg-bg-surface rounded-lg p-6">{children}</div>
    </section>
  )
}

function LabelRow({ children }) {
  return <p className="text-caption text-text-muted mb-2">{children}</p>
}

function GroupLabel({ children }) {
  return <p className="text-label text-text-body mb-3">{children}</p>
}

export default function ComponentPreview() {
  const [searchFilled, setSearchFilled] = useState('Sanderson')
  const [authorValue, setAuthorValue] = useState('')
  const [isbnValue, setIsbnValue] = useState('abc')

  const [starField, setStarField] = useState(4)
  const [authorsDemo, setAuthorsDemo] = useState('Ursula K. Le Guin, Ted Chiang')
  const [chipsDemo, setChipsDemo] = useState(['slow burn', 'found family'])
  const [segmentDemo, setSegmentDemo] = useState('Fiction')
  const [filesDemo, setFilesDemo] = useState([])

  const [starSm, setStarSm] = useState(3)
  const [starMd, setStarMd] = useState(3)
  const [starLg, setStarLg] = useState(3)
  const [starEmpty, setStarEmpty] = useState(0)

  const [openSm, setOpenSm] = useState(false)
  const [openMd, setOpenMd] = useState(false)
  const [openLg, setOpenLg] = useState(false)
  const [openFs, setOpenFs] = useState(false)

  const [toast, setToast] = useState(null)

  const [demoMenuOpen, setDemoMenuOpen] = useState(false)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div className="min-h-screen bg-bg-base text-text-primary pb-24">
      <Toast toast={toast} />

      {/* Real page chrome — the demo specimens below are de-stickied and
          forced to z-0 by their frames, so this bar always wins the paint */}
      <UnifiedNavBar backLabel="Settings" backTo="/settings" />

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <header className="mb-10">
          <h1 className="text-h2 text-text-primary mb-2">Component Preview</h1>
          <p className="text-body-sm text-text-secondary">Design system reference for conversion verification</p>
        </header>

        {/* 1. Button */}
        <Section title="Button">
          <div className="space-y-8">
            <div>
              <GroupLabel>Variants</GroupLabel>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex flex-col gap-1 items-start">
                  <LabelRow>primary / md</LabelRow>
                  <Button variant="primary" size="md">
                    primary / md
                  </Button>
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <LabelRow>secondary / md</LabelRow>
                  <Button variant="secondary" size="md">
                    secondary / md
                  </Button>
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <LabelRow>ghost / md</LabelRow>
                  <Button variant="ghost" size="md">
                    ghost / md
                  </Button>
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <LabelRow>danger / md</LabelRow>
                  <Button variant="danger" size="md">
                    danger / md
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <GroupLabel>Sizes</GroupLabel>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex flex-col gap-1 items-start">
                  <LabelRow>primary / sm</LabelRow>
                  <Button variant="primary" size="sm">
                    primary / sm
                  </Button>
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <LabelRow>primary / md</LabelRow>
                  <Button variant="primary" size="md">
                    primary / md
                  </Button>
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <LabelRow>primary / lg</LabelRow>
                  <Button variant="primary" size="lg">
                    primary / lg
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <GroupLabel>States</GroupLabel>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex flex-col gap-1 items-start">
                  <LabelRow>loading</LabelRow>
                  <Button variant="primary" size="md" loading>
                    Saving…
                  </Button>
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <LabelRow>disabled</LabelRow>
                  <Button variant="primary" size="md" disabled>
                    Unavailable
                  </Button>
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <LabelRow>loading + disabled</LabelRow>
                  <Button variant="primary" size="md" loading disabled>
                    Blocked
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 2. IconButton */}
        <Section title="IconButton">
          <div className="space-y-6">
            <div>
              <GroupLabel>Default variant</GroupLabel>
              <div className="flex flex-wrap gap-3 items-center">
                <IconButton aria-label="Edit" tooltip="Edit">
                  <PrevPencil className="w-5 h-5" />
                </IconButton>
                <IconButton aria-label="Delete" tooltip="Delete">
                  <PrevTrash2 className="w-5 h-5" />
                </IconButton>
                <IconButton aria-label="Add" tooltip="Add">
                  <PrevPlus className="w-5 h-5" />
                </IconButton>
                <IconButton aria-label="Settings" tooltip="Settings">
                  <PrevSettings className="w-5 h-5" />
                </IconButton>
                <IconButton aria-label="Close" tooltip="Close">
                  <PrevX className="w-5 h-5" />
                </IconButton>
              </div>
            </div>
            <div>
              <GroupLabel>Accent variant</GroupLabel>
              <div className="flex flex-wrap gap-3 items-center">
                <IconButton variant="accent" aria-label="Edit" tooltip="Edit">
                  <PrevPencil className="w-5 h-5" />
                </IconButton>
                <IconButton variant="accent" aria-label="Delete" tooltip="Delete">
                  <PrevTrash2 className="w-5 h-5" />
                </IconButton>
                <IconButton variant="accent" aria-label="Add" tooltip="Add">
                  <PrevPlus className="w-5 h-5" />
                </IconButton>
                <IconButton variant="accent" aria-label="Settings" tooltip="Settings">
                  <PrevSettings className="w-5 h-5" />
                </IconButton>
                <IconButton variant="accent" aria-label="Close" tooltip="Close">
                  <PrevX className="w-5 h-5" />
                </IconButton>
              </div>
            </div>
            <div>
              <GroupLabel>Small size</GroupLabel>
              <div className="flex flex-wrap gap-3 items-center">
                <IconButton size="sm" aria-label="Edit sm" tooltip="Edit">
                  <PrevPencil className="w-4 h-4" />
                </IconButton>
                <IconButton size="sm" variant="accent" aria-label="Plus sm" tooltip="Add">
                  <PrevPlus className="w-4 h-4" />
                </IconButton>
              </div>
            </div>
          </div>
        </Section>

        {/* 3. Badge */}
        <Section title="Badge">
          <div className="space-y-6">
            <div>
              <GroupLabel>Solid — result pills (sm, square) + priority overlay (sm, pill)</GroupLabel>
              <div className="flex flex-wrap gap-3 items-center">
                <Badge variant="solid" tone="success" size="sm" pill={false}>NEW</Badge>
                <Badge variant="solid" tone="primary" size="sm" pill={false}>+FORMAT</Badge>
                <Badge variant="solid" tone="danger" size="sm" pill={false}>ERROR</Badge>
                <Badge variant="solid" tone="warning" size="sm">High</Badge>
              </div>
            </div>
            <div>
              <GroupLabel>Tint — format badges (md) + match/source pills</GroupLabel>
              <div className="flex flex-wrap gap-3 items-center">
                <Badge variant="tint" tone="fiction" size="md" title="EPUB edition">EPUB</Badge>
                <Badge variant="tint" tone="warning" size="md">Physical</Badge>
                <Badge variant="tint" tone="fandom" size="md">Audiobook</Badge>
                <Badge variant="tint" tone="nonfiction" size="md">Web</Badge>
                <Badge variant="tint" tone="character" size="md">Extracted from EPUB</Badge>
                <Badge variant="tint" tone="fanfiction" size="sm" pill={false}>Same Author</Badge>
              </div>
            </div>
            <div>
              <GroupLabel>Outline — category chip (lg)</GroupLabel>
              <div className="flex flex-wrap gap-3 items-center">
                <Badge variant="outline" size="lg">Fiction</Badge>
                <Badge variant="outline" size="lg">FanFiction</Badge>
              </div>
            </div>
            <div>
              <GroupLabel>Muted — type badges (sm, square) + neutral fallback (md)</GroupLabel>
              <div className="flex flex-wrap gap-3 items-center">
                <Badge variant="muted" size="sm" pill={false}>Checklist</Badge>
                <Badge variant="muted" size="sm" pill={false}>Auto</Badge>
                <Badge variant="muted" size="md">Generated Gradient</Badge>
              </div>
            </div>
            <p className="text-caption text-text-muted">
              Display-only span — interactive/filter chips are a different component class. No status
              mode: reading-status labels render in BookCard/AcquireCard via useStatusLabels.
            </p>
          </div>
        </Section>

        {/* 4. SearchInput */}
        <Section title="SearchInput">
          <div className="max-w-md space-y-4">
            <div>
              <LabelRow>Empty (placeholder: Search titles…)</LabelRow>
              <SearchInput value="" onChange={() => {}} placeholder="Search titles..." />
            </div>
            <div>
              <LabelRow>Filled (Sanderson)</LabelRow>
              <SearchInput value={searchFilled} onChange={setSearchFilled} placeholder="Search titles..." />
            </div>
            <div>
              <LabelRow>Loading</LabelRow>
              <SearchInput value="Le Guin" onChange={() => {}} loading placeholder="Search titles..." />
            </div>
          </div>
        </Section>

        {/* 5. FormField */}
        <Section title="FormField">
          <div className="max-w-md space-y-4">
            <FormField label="Title" value="The Left Hand of Darkness" onChange={() => {}} placeholder="Enter book title" />
            <FormField
              label="Notes"
              type="textarea"
              value="Winter reads like a thought experiment set in ice."
              onChange={() => {}}
              placeholder="Your thoughts..."
              rows={4}
            />
            <FormField
              label="Author"
              value={authorValue}
              onChange={setAuthorValue}
              placeholder="Author name"
              error={true}
            />
            <FormField
              label="ISBN"
              value={isbnValue}
              onChange={setIsbnValue}
              placeholder="ISBN-13"
              error="Must be a valid ISBN"
            />
            <FormField label="Rating">
              <StarRating value={starField} onChange={setStarField} size="md" />
            </FormField>
          </div>
        </Section>

        {/* 6. StarRating */}
        <Section title="StarRating">
          <div className="space-y-8">
            <div>
              <GroupLabel>Interactive (default 3)</GroupLabel>
              <div className="space-y-4">
                <div>
                  <LabelRow>size=&quot;sm&quot; — value {starSm ?? '—'}</LabelRow>
                  <StarRating value={starSm} onChange={setStarSm} size="sm" />
                </div>
                <div>
                  <LabelRow>size=&quot;md&quot; — value {starMd ?? '—'}</LabelRow>
                  <StarRating value={starMd} onChange={setStarMd} size="md" />
                </div>
                <div>
                  <LabelRow>size=&quot;lg&quot; — value {starLg ?? '—'}</LabelRow>
                  <StarRating value={starLg} onChange={setStarLg} size="lg" />
                </div>
                <div>
                  <LabelRow>Empty / clearable — value {starEmpty ?? 0}</LabelRow>
                  <StarRating value={starEmpty} onChange={setStarEmpty} size="md" />
                </div>
              </div>
            </div>
            <div>
              <GroupLabel>Read-only (value 4.5)</GroupLabel>
              <div className="space-y-4">
                <div>
                  <LabelRow>readOnly size=&quot;sm&quot;</LabelRow>
                  <StarRating value={4.5} readOnly size="sm" />
                </div>
                <div>
                  <LabelRow>readOnly size=&quot;md&quot;</LabelRow>
                  <StarRating value={4.5} readOnly size="md" />
                </div>
                <div>
                  <LabelRow>readOnly size=&quot;lg&quot;</LabelRow>
                  <StarRating value={4.5} readOnly size="lg" />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 7. Modal */}
        <Section title="Modal">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="secondary" size="sm" onClick={() => setOpenSm(true)}>
                Open sm Modal
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setOpenMd(true)}>
                Open md Modal
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setOpenLg(true)}>
                Open lg Modal
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setOpenFs(true)}>
                Open Fullscreen Modal
              </Button>
            </div>

            <Modal isOpen={openSm} onClose={() => setOpenSm(false)} size="sm">
              <Modal.Header onClose={() => setOpenSm(false)}>Small modal</Modal.Header>
              <Modal.Body>
                <p className="text-body-sm text-text-secondary">
                  A short note on <em>The Dispossessed</em> — Shevek walks between two worlds.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" size="md" onClick={() => setOpenSm(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" onClick={() => setOpenSm(false)}>
                  OK
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal isOpen={openMd} onClose={() => setOpenMd(false)} size="md">
              <Modal.Header onClose={() => setOpenMd(false)}>Edit excerpt</Modal.Header>
              <Modal.Body>
                <FormField
                  label="Quote"
                  type="textarea"
                  value="It is good to have an end to journey toward; but it is the journey that matters, in the end."
                  onChange={() => {}}
                  rows={3}
                />
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" size="md" onClick={() => setOpenMd(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" onClick={() => setOpenMd(false)}>
                  Save
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal isOpen={openLg} onClose={() => setOpenLg(false)} size="lg">
              <Modal.Header onClose={() => setOpenLg(false)}>Reading list</Modal.Header>
              <Modal.Body>
                <p className="text-body-sm text-text-secondary mb-3">
                  Longer content: novels by N.K. Jemisin, Octavia Butler, and Ted Chiang sit side by side on the
                  shelf. Use this modal to confirm bulk actions or review metadata before sync.
                </p>
                <ul className="list-disc list-inside text-body-sm text-text-secondary space-y-1">
                  <li>The Fifth Season — broken moon, stone lore, survival.</li>
                  <li>Parable of the Sower — Earthseed verses walk beside the road.</li>
                  <li>Exhalation — breath as metaphor for thought experiments.</li>
                </ul>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" size="md" onClick={() => setOpenLg(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" onClick={() => setOpenLg(false)}>
                  Apply
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal isOpen={openFs} onClose={() => setOpenFs(false)} size="fullscreen">
              <Modal.Header onClose={() => setOpenFs(false)}>
                Fullscreen reader
              </Modal.Header>
              <Modal.Body>
                <p className="text-body-sm text-text-secondary">
                  Full viewport panel for immersive notes — same tokens as the rest of the app. Close with the
                  button in the header or Escape.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" size="md" onClick={() => setOpenFs(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" onClick={() => setOpenFs(false)}>
                  Done
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        </Section>

        {/* 8. Toast */}
        <Section title="Toast">
          <div className="space-y-4">
            <p className="text-body-sm text-text-secondary">
              Renders fixed at bottom. Types supported: <span className="text-text-primary">success</span>,{' '}
              <span className="text-text-primary">error</span>, <span className="text-text-primary">loading</span>.
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="secondary" size="sm" onClick={() => setToast({ type: 'success', message: 'Saved to library' })}>
                Trigger success
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setToast({ type: 'error', message: 'Could not sync folder' })}>
                Trigger error
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setToast({ type: 'loading', message: 'Scanning volumes…' })}>
                Trigger loading
              </Button>
            </div>
          </div>
        </Section>

        {/* 9. UnifiedNavBar */}
        <Section title="UnifiedNavBar">
          <div className="space-y-4">
            <div className="border border-border-default rounded-lg overflow-hidden [&>div]:!relative [&>div]:!top-auto [&>div]:!z-0">
              <UnifiedNavBar title="Sample Page" />
            </div>
            <p className="text-caption text-text-muted">Title-only variant (no back link, no right slot).</p>

            <div className="border border-border-default rounded-lg overflow-hidden [&>div]:!relative [&>div]:!top-auto [&>div]:!z-0">
              <UnifiedNavBar backLabel="Sample Page" backTo="/">
                <IconButton variant="accent" aria-label="Settings" tooltip="Settings">
                  <PrevSettings className="w-5 h-5" />
                </IconButton>
              </UnifiedNavBar>
            </div>
            <p className="text-caption text-text-muted">
              Back link + right slot via <code className="text-text-secondary">children</code>. Renders sticky in
              actual usage.
            </p>
          </div>
        </Section>

        {/* 10. AuthorInput */}
        <Section title="AuthorInput">
          <div className="max-w-md space-y-4">
            <div>
              <LabelRow>Interactive — value is a comma-joined string: &quot;{authorsDemo}&quot;</LabelRow>
              <AuthorInput value={authorsDemo} onChange={setAuthorsDemo} />
            </div>
            <div>
              <LabelRow>Empty (default placeholder)</LabelRow>
              <AuthorInput value="" onChange={() => {}} />
            </div>
            <div>
              <LabelRow>Error state (boolean — danger border only; message comes from the wrapping FormField)</LabelRow>
              <AuthorInput value="" onChange={() => {}} error placeholder="Author name" />
            </div>
            <p className="text-caption text-text-muted">
              Autocomplete draws on the library&apos;s author list, fetched once on mount — suggestions need the API
              reachable.
            </p>
          </div>
        </Section>

        {/* 11. ChipInput */}
        <Section title="ChipInput">
          <div className="max-w-md space-y-4">
            <div>
              <LabelRow>Interactive — value is an array ({chipsDemo.length} chips); Enter or comma commits, lowercase-normalized</LabelRow>
              <ChipInput
                label="Tags"
                value={chipsDemo}
                onChange={setChipsDemo}
                placeholder="Add a tag..."
                suggestions={['slow burn', 'found family', 'hurt/comfort', 'canon divergence', 'fix-it']}
              />
            </div>
            <div>
              <LabelRow>Error state (string renders through its embedded FormField)</LabelRow>
              <ChipInput label="Tags" value={[]} onChange={() => {}} error="Must have at least one tag" />
            </div>
            <p className="text-caption text-text-muted">
              Embeds its own FormField — never wrap it in another one.
            </p>
          </div>
        </Section>

        {/* 12. SegmentedControl */}
        <Section title="SegmentedControl">
          <div className="max-w-md space-y-4">
            <div>
              <LabelRow>Production shape — size=&quot;sm&quot; + ariaLabel, inside FormField — value: {segmentDemo}</LabelRow>
              <FormField label="Category">
                <SegmentedControl
                  size="sm"
                  value={segmentDemo}
                  onChange={setSegmentDemo}
                  options={DEMO_CATEGORY_OPTIONS}
                  ariaLabel="Category"
                />
              </FormField>
            </div>
            <p className="text-caption text-text-muted">
              Every production caller passes size=&quot;sm&quot; + ariaLabel — the 11px sm label size is locked by
              decision. Matching is strict ===.
            </p>
          </div>
        </Section>

        {/* 13. FileDropZone */}
        <Section title="FileDropZone">
          <div className="space-y-4">
            <div>
              <LabelRow>Controlled — files stay in memory, nothing uploads ({filesDemo.length} selected)</LabelRow>
              <FileDropZone
                files={filesDemo}
                onFilesChange={setFilesDemo}
                allowedExtensions={['.epub', '.pdf', '.mobi', '.azw3']}
                maxFileSize={104857600}
                maxFiles={20}
              />
            </div>
            <div>
              <LabelRow>Disabled</LabelRow>
              <FileDropZone files={[]} onFilesChange={() => {}} disabled />
            </div>
            <p className="text-caption text-text-muted">
              Production callers fetch constraints from /api/upload/limits — the demo passes static values (100 MB,
              20 files).
            </p>
          </div>
        </Section>

        {/* 14. MenuItem */}
        <Section title="MenuItem">
          <div className="space-y-4">
            <div>
              <LabelRow>default / icon / danger / disabled / to — in a mock elevated menu container</LabelRow>
              <div className="max-w-xs bg-bg-elevated border border-border-default rounded-lg shadow-xl py-1 overflow-hidden">
                <MenuItem onClick={() => {}}>Default item</MenuItem>
                <MenuItem icon={<PrevPencil className="w-4 h-4" />} onClick={() => {}}>
                  With icon
                </MenuItem>
                <MenuItem danger icon={<PrevTrash2 className="w-4 h-4" />} onClick={() => {}}>
                  Danger item
                </MenuItem>
                <MenuItem disabled onClick={() => {}}>
                  Disabled item
                </MenuItem>
                <MenuItem to="/dev/components">Link item (to)</MenuItem>
              </div>
            </div>
            <p className="text-caption text-text-muted">
              Owns item concerns only — padding, tap height, danger color, disabled dimming, icon slot.
              Dividers, headers, and sheet chrome belong to the container. No trailing slot, no submenus,
              no selected state, no roving focus (excluded by decision).
            </p>
          </div>
        </Section>

        {/* 15. ThreeDotMenu */}
        <Section title="ThreeDotMenu">
          <div className="space-y-4">
            <div>
              <LabelRow>Controlled — desktop dropdown ≥768px, portaled bottom sheet on mobile</LabelRow>
              <div className="flex justify-end max-w-xs">
                <ThreeDotMenu
                  menuOpen={demoMenuOpen}
                  setMenuOpen={setDemoMenuOpen}
                  menuItems={[
                    { label: 'Edit', onClick: () => setDemoMenuOpen(false) },
                    { label: 'Change Cover', icon: <PrevPencil className="w-4 h-4" />, onClick: () => setDemoMenuOpen(false) },
                    { type: 'divider' },
                    { label: 'Hidden item', show: false, onClick: () => setDemoMenuOpen(false) },
                    { label: 'Delete Title', danger: true, onClick: () => setDemoMenuOpen(false) },
                  ]}
                />
              </div>
            </div>
            <p className="text-caption text-text-muted">
              Items render via MenuItem in both containers (bg-bg-elevated, ratified). Item onClick
              handlers close the menu themselves. The show flag hides rows (one is hidden here);
              divider rows draw hairlines. Sheet chrome — handle, Cancel, backdrop — lives in the
              component.
            </p>
          </div>
        </Section>
      </div>
    </div>
  )
}
