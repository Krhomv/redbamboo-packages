import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "../utils"
import { Button } from "./button"
import { useUiEnvironment } from "../ui-environment"

export type DialogMotion = "composed" | "snappy"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ container, ...props }: DialogPrimitive.Portal.Props) {
  const environment = useUiEnvironment()
  return <DialogPrimitive.Portal data-slot="dialog-portal" container={container ?? environment.portalContainer} {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  motion = "composed",
  ...props
}: DialogPrimitive.Backdrop.Props & {
  motion?: DialogMotion
}) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      data-motion={motion}
      className={cn(
        "rb-dialog-overlay fixed inset-0 isolate z-50",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  motion = "composed",
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  motion?: DialogMotion
}) {
  return (
    <DialogPortal>
      <DialogOverlay motion={motion} />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        data-motion={motion}
        className={cn(
          "rb-dialog-content fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] flex-col overflow-hidden max-h-[calc(100svh-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-5 text-sm text-popover-foreground ring-1 ring-foreground-a10 outline-none sm:max-w-md",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-sm"
              />
            }
          >
            <i className="ph-bold ph-x" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-5 -mb-5 flex flex-col-reverse gap-2 border-t bg-muted-a50 px-5 py-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function DialogSearchField({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-search-field"
      className={cn(
        "flex h-10 items-center gap-2.5 rounded-lg border border-input px-3 transition-colors focus-within:border-ring dark:bg-input-a30",
        className,
      )}
      {...props}
    >
      <i className="ph ph-magnifying-glass shrink-0 text-base opacity-50" aria-hidden />
      {children}
    </div>
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogSearchField,
  DialogTitle,
  DialogTrigger,
}
