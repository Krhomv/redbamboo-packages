import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../utils"
import { useUiEnvironment } from "../ui-environment"
import { Button } from "./button"
import type { DialogMotion } from "./dialog"

const sheetVariants = cva(
  "rb-sheet fixed z-[70] flex max-h-[60svh] flex-col bg-popover text-sm text-popover-foreground shadow-lg outline-none",
  {
    variants: {
      side: {
        bottom: "inset-x-0 bottom-0 rounded-t-xl border-t border-overlay-10",
      },
    },
    defaultVariants: {
      side: "bottom",
    },
  },
)

export type SheetSide = NonNullable<VariantProps<typeof sheetVariants>["side"]>

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  "aria-label": string
  children: React.ReactNode
  side?: SheetSide
  motion?: DialogMotion
  className?: string
  overlayClassName?: string
  contentClassName?: string
  closeLabel?: string
  showCloseButton?: boolean
  onHeightChange?: (height: number) => void
  initialFocus?: DialogPrimitive.Popup.Props["initialFocus"]
  finalFocus?: DialogPrimitive.Popup.Props["finalFocus"]
}

/**
 * A modal edge sheet with focus containment, Escape/outside dismissal, safe-area
 * padding, and the design system's composed motion profile.
 */
export function Sheet({
  open,
  onOpenChange,
  "aria-label": ariaLabel,
  children,
  side = "bottom",
  motion = "composed",
  className,
  overlayClassName,
  contentClassName,
  closeLabel = `Close ${ariaLabel}`,
  showCloseButton = true,
  onHeightChange,
  initialFocus,
  finalFocus,
}: SheetProps) {
  const environment = useUiEnvironment()
  const [panel, setPanel] = React.useState<HTMLDivElement | null>(null)

  React.useLayoutEffect(() => {
    if (!open || !onHeightChange) return
    if (!panel) return

    const report = () => onHeightChange(panel.getBoundingClientRect().height)
    report()
    const ResizeObserverCtor = (environment.window as Window & typeof globalThis).ResizeObserver
    if (!ResizeObserverCtor) return
    const observer = new ResizeObserverCtor(report)
    observer.observe(panel)
    return () => observer.disconnect()
  }, [environment.window, onHeightChange, open, panel])

  return (
    <DialogPrimitive.Root
      open={open}
      modal
      onOpenChange={(nextOpen) => onOpenChange(nextOpen)}
    >
      <DialogPrimitive.Portal container={environment.portalContainer}>
        <DialogPrimitive.Backdrop
          data-slot="sheet-overlay"
          data-motion={motion}
          className={cn("rb-sheet-overlay fixed inset-0 z-[69] bg-black/20", overlayClassName)}
        />
        <DialogPrimitive.Popup
          ref={setPanel}
          data-slot="sheet"
          data-side={side}
          data-motion={motion}
          aria-label={ariaLabel}
          initialFocus={initialFocus}
          finalFocus={finalFocus}
          className={cn(sheetVariants({ side }), className)}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div data-slot="sheet-header" className="relative flex h-11 shrink-0 items-center justify-center">
            <span className="h-1 w-10 rounded-full bg-overlay-20" aria-hidden="true" />
            {showCloseButton ? (
              <DialogPrimitive.Close
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-2 top-0 size-11"
                    aria-label={closeLabel}
                  />
                }
              >
                <i className="ph-bold ph-caret-down text-base" aria-hidden="true" />
              </DialogPrimitive.Close>
            ) : null}
          </div>
          <div
            data-slot="sheet-content"
            className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", contentClassName)}
          >
            {children}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export { sheetVariants }
