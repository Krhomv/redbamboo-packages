# Sheet and MediaViewer migration

## Gallery

- Replace the local `Sheet` with `Sheet` from `@redbamboo/ui`. Rename `ariaLabel` to `aria-label`, and replace `onClose={close}` with `onOpenChange={(open) => { if (!open) close() }}`. `onHeightChange`, focus containment, Escape/scrim dismissal, safe-area padding, and composed motion are built in.
- Replace `GalleryLightbox`'s stage/navigation/gesture shell with controlled `MediaViewer`. Map each media item to `{ id, src: imageUrl, type: mediaType, alt: name, width, height, placeholderSrc }` and keep Gallery curation in the slots: `desktopPanel={MetadataPanel}`, `mobileDetails={MetadataPanel | TagPickerPanel}`, and `mobileActions={Pick/Reject/Tag}`.
- Keep Gallery-specific shortcuts (pick, reject, rating, tag) in its adapter. `MediaViewer` owns ArrowLeft, ArrowRight, Escape, and I.

## Wallpaper

- Replace `WallpaperLightbox`'s stage and `showInfo` state with controlled `MediaViewer`; map `assetUrl` to `src` and prompt/name to `alt`.
- Pass the current details/curation column as `desktopPanel`, the same details in a compact wrapper as `mobileDetails`, and Keep/Reject/Apply/Reroll actions as `mobileActions` where appropriate.
- `index`, `onIndexChange`, and `onClose` map directly. The existing optional action callbacks remain Wallpaper-owned slot content.

`ImageLightbox` remains exported and unchanged for single-image consumers that do not need navigation or metadata.
