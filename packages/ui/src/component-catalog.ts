export interface UiComponentDescriptor {
  id: string
  packageName: string
  exports: readonly string[]
  description: string
  tags: readonly string[]
  useWhen: readonly string[]
  avoidWhen: readonly string[]
  variants: readonly string[]
  selectors: readonly string[]
}

export const UI_COMPONENT_CATALOG: readonly UiComponentDescriptor[] = [
  {
    id: "media-viewer",
    packageName: "@redbamboo/ui",
    exports: ["MediaViewer", "MediaViewerItem", "MediaViewerContext", "MediaViewerZoom"],
    description: "Full-screen, multi-item image and video viewer with responsive detail and action slots.",
    tags: ["media", "image", "video", "lightbox", "viewer", "gallery", "zoom", "swipe"],
    useWhen: [
      "Inspecting or navigating an array of images and videos in a fixed dark stage.",
      "A media experience needs desktop metadata, mobile details, or mobile action composition.",
      "Images need placeholder-to-original loading, zoom, pan, swipe, or sheet-aware fitting.",
    ],
    avoidWhen: [
      "Showing one image with no metadata or navigation; use ImageLightbox.",
      "Embedding media inline in document flow.",
    ],
    variants: ["image", "video", "desktop-panel", "mobile-sheet", "mobile-actions"],
    selectors: [
      '[data-slot="media-viewer"]',
      '[data-slot="media-viewer-stage"]',
      '[data-slot="media-viewer-image"]',
      '[data-slot="media-viewer-video"]',
      '[data-slot="media-viewer-placeholder"]',
      '[data-slot="media-viewer-position"]',
      '[data-slot="media-viewer-desktop-panel"]',
      '[data-slot="media-viewer-action-row"]',
    ],
  },
  {
    id: "sheet",
    packageName: "@redbamboo/ui",
    exports: ["Sheet", "sheetVariants"],
    description: "Edge sheet with optional modal containment, safe-area padding, and composed motion.",
    tags: ["sheet", "bottom-sheet", "dialog", "mobile", "overlay", "focus-trap"],
    useWhen: [
      "Presenting contextual controls or details from a viewport edge.",
      "A mobile workflow needs a modal bottom sheet with measured height.",
      "A parent modal needs a non-modal nested sheet that leaves the parent surface interactive.",
    ],
    avoidWhen: [
      "The content should be a centered modal; use Dialog.",
      "The content is a lightweight anchored disclosure; use Popover.",
    ],
    variants: ["side:bottom", "motion:composed", "motion:snappy"],
    selectors: [
      '[data-slot="sheet"]',
      '[data-slot="sheet-overlay"]',
      '[data-slot="sheet-header"]',
      '[data-slot="sheet-content"]',
    ],
  },
  {
    id: "entity-card",
    packageName: "@redbamboo/ui",
    exports: [
      "EntityCard",
      "EntityIdentity",
      "EntityInteractionProvider",
      "EntityPresentationProvider",
      "useEntityCardPresentation",
      "queryEntityCards",
    ],
    description: "Canonical compact presentation and interaction surface for a RedBamboo entity identity.",
    tags: ["entity", "reference", "identity", "avatar", "link", "inspection", "selection", "ai-native"],
    useWhen: [
      "Showing an entity reference in a list, form, picker, modal, or provenance surface.",
      "A browser agent needs stable entity identity and navigation metadata in the DOM.",
      "A custom rich card needs the shared entity identity anatomy without the compact card surface.",
      "A host needs to hydrate identity-only references through an authorized display projection.",
    ],
    avoidWhen: [
      "Rendering a generic non-entity card.",
      "Rendering a rich workspace tile or document preview whose outer layout has different semantics; compose EntityIdentity instead.",
      "Fetching, parsing, or resolving RedLeaf entity data inside the design system.",
    ],
    variants: ["row", "outlined", "width:quarter", "width:half", "width:full"],
    selectors: [
      '[data-slot="entity-card"]',
      '[data-slot="entity-card-primary"]',
      '[data-slot="entity-card-open"]',
      '[data-slot="entity-identity"]',
      '[data-slot="entity-media"]',
      '[data-slot="entity-name"]',
      '[data-slot="entity-details"]',
      '[data-slot="entity-trailing"]',
      '[data-slot="entity-actions"]',
      '[data-entity-action="inspect"]',
      '[data-entity-width]',
      '[data-inspected]',
    ],
  },
  {
    id: "floating-surface",
    packageName: "@redbamboo/utility",
    exports: ["registerUiSurface", "useUiSurface", "runUiSurfaceAction"],
    description: "Machine-readable lifecycle and action contract for a browser-local secondary UI surface such as Document Picture-in-Picture.",
    tags: ["surface", "floating", "picture-in-picture", "always-on-top", "ai-native", "multi-window"],
    useWhen: [
      "A plugin exposes a browser-local secondary window whose support and lifecycle must be queryable.",
      "A browser agent needs a stable semantic trigger plus structured action results.",
    ],
    avoidWhen: [
      "The UI is an ordinary dialog or popover inside the current document.",
      "The desired behavior requires a native transparent or click-through operating-system overlay.",
    ],
    variants: ["document-picture-in-picture"],
    selectors: [
      '[data-slot="floating-surface-trigger"]',
      '[data-slot="floating-surface-root"]',
      '[data-ui-surface]',
      '[data-ui-action]',
    ],
  },
]

/** Search the machine-readable design-system catalog by purpose, tag, or export name. */
export function findUiComponents(query: string): UiComponentDescriptor[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return [...UI_COMPONENT_CATALOG]
  return UI_COMPONENT_CATALOG.filter((component) => {
    const text = [
      component.id,
      component.packageName,
      component.description,
      ...component.exports,
      ...component.tags,
      ...component.useWhen,
      ...component.avoidWhen,
      ...component.variants,
    ].join(" ").toLowerCase()
    return text.includes(normalized)
  })
}
