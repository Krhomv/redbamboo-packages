import * as React from "react"
import { createRoot } from "react-dom/client"

import { MaintenanceNotice } from "../../../chat/src/components/maintenance-notice"
import { Button, ItemListRow, MediaViewer, SectionHeader, SettingRow, Sheet, type MediaViewerItem } from "../../src/index"
import "./story.css"

function svgData(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const placeholder = svgData(`
  <svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80">
    <rect width="120" height="80" fill="#273442"/><circle cx="73" cy="30" r="24" fill="#c28d62"/>
    <path d="M0 60L35 27L61 52L82 35L120 66V80H0Z" fill="#486d68"/>
  </svg>`)

const alpineImage = svgData(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1067" viewBox="0 0 1600 1067">
    <defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#15283f"/><stop offset=".55" stop-color="#d48d68"/><stop offset="1" stop-color="#f3c189"/></linearGradient><linearGradient id="lake" x2="0" y2="1"><stop stop-color="#466f75"/><stop offset="1" stop-color="#172d38"/></linearGradient></defs>
    <rect width="1600" height="1067" fill="url(#sky)"/><circle cx="1125" cy="325" r="142" fill="#ffd9a4" opacity=".82"/>
    <path d="M0 650L250 380L430 570L690 245L960 590L1210 335L1600 675V820H0Z" fill="#2c3943"/>
    <path d="M385 610L690 245L960 590L835 518L690 390L560 535Z" fill="#e8e2db" opacity=".88"/>
    <path d="M0 680L300 520L520 710L850 495L1120 700L1390 530L1600 690V860H0Z" fill="#314f4c"/>
    <path d="M0 780Q400 710 800 785T1600 760V1067H0Z" fill="url(#lake)"/>
    <path d="M0 825Q410 770 800 835T1600 810" fill="none" stroke="#f6c997" stroke-width="10" opacity=".38"/>
  </svg>`)

const forestImage = svgData(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1067" viewBox="0 0 1600 1067">
    <defs><linearGradient id="g" x2="0" y2="1"><stop stop-color="#182d33"/><stop offset="1" stop-color="#708b73"/></linearGradient></defs>
    <rect width="1600" height="1067" fill="url(#g)"/><circle cx="800" cy="280" r="170" fill="#d8b785" opacity=".7"/>
    <g fill="#183a35"><path d="M160 900L360 260L560 900Z"/><path d="M460 940L700 190L940 940Z"/><path d="M850 930L1100 250L1350 930Z"/><path d="M1170 930L1380 350L1590 930Z"/></g>
    <path d="M0 850Q410 760 800 850T1600 820V1067H0Z" fill="#102b2d"/>
  </svg>`)

const items: MediaViewerItem[] = [
  { id: "alpine", src: alpineImage, placeholderSrc: placeholder, alt: "Warm sunset over an alpine lake", width: 1600, height: 1067 },
  { id: "forest", src: forestImage, alt: "Moonlit evergreen forest", width: 1600, height: 1067 },
  { id: "clip", src: "data:video/mp4;base64,AAAA", type: "video", posterSrc: forestImage, alt: "Short forest clip", width: 1600, height: 1067 },
]

function Details({ item }: { item: MediaViewerItem }) {
  return (
    <div className="flex flex-col gap-4 p-5">
      <div>
        <SectionHeader>Media details</SectionHeader>
        <h2 className="font-heading text-lg font-medium">{item.alt}</h2>
      </div>
      <p className="text-sm leading-relaxed text-text-muted">
        A representative library item with editorial metadata, curation controls, and a placeholder-backed original.
      </p>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div><SectionHeader>Format</SectionHeader><span>16 : 10</span></div>
        <div><SectionHeader>Source</SectionHeader><span>Leaf Assets</span></div>
      </div>
      <div className="flex gap-2">
        <Button size="sm">Keep</Button>
        <Button size="sm" variant="outline">Reject</Button>
      </div>
    </div>
  )
}

function ContrastAudit() {
  const maintenance = {
    state: "draining" as const,
    paused: true,
    runId: "visual-audit",
    startedAt: "2026-10-17T10:00:00Z",
    changedAt: "2026-10-17T10:00:00Z",
    activeTurnCount: 2,
  }
  return (
    <main className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto max-w-6xl">
        <SectionHeader>Muted text contrast audit</SectionHeader>
        <h1 className="font-heading text-2xl font-medium">Three production surfaces</h1>
        <p className="mt-2 text-sm text-text-muted">Actual shared components from chat and the design system.</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section data-audit-surface="chat" className="flex min-h-64 flex-col rounded-2xl border border-border-subtle bg-surface-elevated p-5 shadow-sm">
            <SectionHeader>Chat message footer</SectionHeader>
            <div className="flex-1 rounded-xl bg-surface-base p-4 text-sm leading-relaxed text-text-primary">
              The update will wait until active conversations finish, then resume this thread automatically.
            </div>
            <div className="-mx-4 mt-5">
              <MaintenanceNotice status={maintenance} hasServerSession />
            </div>
          </section>

          <section data-audit-surface="item-list" className="min-h-64 overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated shadow-sm">
            <div className="p-5 pb-2"><SectionHeader>Item-list subtitles</SectionHeader></div>
            <ItemListRow title="Alpine sunset" subtitle="Generated 12 minutes ago · 1600 × 1067" selected />
            <ItemListRow title="Moonlit forest" subtitle="Generated yesterday · Editorial pick" />
            <ItemListRow title="Quiet shoreline" subtitle="Imported from Leaf Assets" />
          </section>

          <section data-audit-surface="settings" className="min-h-64 rounded-2xl border border-border-subtle bg-surface-elevated p-5 shadow-sm">
            <SectionHeader>Settings section</SectionHeader>
            <SettingRow label="Show metadata" hint="Include generation details in the viewer.">
              <input aria-label="Show metadata" type="checkbox" defaultChecked />
            </SettingRow>
            <SettingRow label="Autoplay video" hint="Begin playback when video becomes active.">
              <input aria-label="Autoplay video" type="checkbox" />
            </SettingRow>
          </section>
        </div>
      </div>
    </main>
  )
}

function Story() {
  const params = new URLSearchParams(window.location.search)
  const component = params.get("component") ?? "viewer"
  const theme = params.get("theme") ?? "light"
  const token = params.get("token") ?? "after"
  const [sheetOpen, setSheetOpen] = React.useState(component === "sheet")
  const [viewerOpen, setViewerOpen] = React.useState(component === "viewer")
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark" || theme === "high-contrast")
    if (theme === "low-contrast") root.dataset.contrast = "low"
    else if (theme === "high-contrast") root.dataset.contrast = "high"
    else delete root.dataset.contrast
    if (token === "before" && theme === "dark") root.style.setProperty("--color-text-muted", "#9B9CA2")
    else if (token === "before" && theme === "low-contrast") root.style.setProperty("--color-text-muted", "#8B919A")
    else root.style.removeProperty("--color-text-muted")
  }, [theme, token])

  if (component === "contrast") return <ContrastAudit />

  return (
    <main className="min-h-screen bg-background p-6 text-foreground sm:p-10">
      <div className="mx-auto max-w-4xl">
        <SectionHeader>Overlay components</SectionHeader>
        <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-sm">
          <h1 className="font-heading text-2xl font-medium">Sheet and MediaViewer</h1>
          <p className="mt-2 max-w-xl text-sm text-text-muted">Keyboard-safe, portal-aware overlays for Leaf media workflows.</p>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => setSheetOpen(true)}>Open sheet</Button>
            <Button variant="outline" onClick={() => { setIndex(0); setViewerOpen(true) }}>Open viewer</Button>
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} aria-label="Collection settings">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-5 pb-6">
          <div>
            <SectionHeader>Collection settings</SectionHeader>
            <h2 className="font-heading text-lg font-medium">Presentation</h2>
            <p className="mt-1 text-sm text-text-muted">Tune how this collection appears across Leaf.</p>
          </div>
          <label className="flex items-center justify-between gap-4 text-sm"><span>Show metadata</span><input aria-label="Show metadata" type="checkbox" defaultChecked /></label>
          <label className="flex items-center justify-between gap-4 text-sm"><span>Autoplay video</span><input aria-label="Autoplay video" type="checkbox" /></label>
          <Button data-testid="sheet-last-action" onClick={() => setSheetOpen(false)}>Save settings</Button>
        </div>
      </Sheet>

      {viewerOpen ? (
        <MediaViewer
          items={items}
          index={index}
          onIndexChange={setIndex}
          onClose={() => setViewerOpen(false)}
          desktopPanel={({ item }) => <Details item={item} />}
          mobileDetails={({ item }) => <Details item={item} />}
          mobileActions={
            <>
              <Button size="sm">Keep</Button>
              <Button size="sm" variant="ghost">Reject</Button>
            </>
          }
        />
      ) : null}
    </main>
  )
}

createRoot(document.getElementById("root")!).render(<Story />)
