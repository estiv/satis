"use client";

import { cloneElement, isValidElement, useActionState, useEffect, useId, useState } from "react";
import type { ActionState } from "@/lib/form";
import { Button, FormError, buttonClass } from "./ui";
import { clsx } from "./clsx";

export function Modal({
  title,
  open,
  onClose,
  children,
  wide,
  xl,
  hideClose,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  xl?: boolean;
  hideClose?: boolean;
}) {
  const headingId = useId();
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <button type="button" className="absolute inset-0 bg-ink/50" aria-label="Close" onClick={onClose} />
      <div
        className={clsx(
          "relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-card p-5 shadow-lg sm:rounded-2xl",
          xl ? "sm:max-w-5xl" : wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={headingId} className="text-lg font-semibold">
            {title}
          </h2>
          {hideClose ? null : (
            <button type="button" className={buttonClass("ghost", "xs", "text-muted hover:text-ink")} onClick={onClose}>
              Close
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormModal({
  title,
  trigger,
  triggerVariant = "primary",
  action,
  submitLabel = "Save",
  children,
  wide,
  xl,
  compact,
  defaultOpen = false,
  triggerClassName,
}: {
  title: string;
  trigger: string;
  triggerVariant?: "primary" | "secondary" | "ghost" | "danger";
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel?: string;
  children: React.ReactNode;
  wide?: boolean;
  xl?: boolean;
  compact?: boolean;
  defaultOpen?: boolean;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={compact ? "xs" : "sm"}
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        {trigger}
      </Button>
      <Modal title={title} open={open} onClose={() => setOpen(false)} wide={wide} xl={xl}>
        <ModalActionForm
          key={String(open)}
          action={action}
          submitLabel={submitLabel}
          onCancel={() => setOpen(false)}
          onDone={() => setOpen(false)}
        >
          {children}
        </ModalActionForm>
      </Modal>
    </>
  );
}

function ModalActionForm({
  action,
  submitLabel,
  children,
  onCancel,
  onDone,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  children: React.ReactNode;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {children}
      <FormError state={state} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function OpenModal({
  title,
  trigger,
  triggerVariant = "secondary",
  children,
  wide,
  xl,
  compact,
  hideClose,
}: {
  title: string;
  trigger: string;
  triggerVariant?: "primary" | "secondary" | "ghost" | "danger";
  children: React.ReactNode;
  wide?: boolean;
  xl?: boolean;
  compact?: boolean;
  hideClose?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const body = isValidElement(children)
    ? cloneElement(children, { onCancel: close } as { onCancel: () => void })
    : children;
  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={compact ? "xs" : "sm"}
        onClick={() => setOpen(true)}
      >
        {trigger}
      </Button>
      <Modal title={title} open={open} onClose={close} wide={wide} xl={xl} hideClose={hideClose}>
        {body}
      </Modal>
    </>
  );
}

export function ConfirmForm({
  action,
  confirmMessage,
  label,
  variant = "secondary",
  compact = true,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  confirmMessage: string;
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  compact?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={compact ? "xs" : "sm"}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <Modal title={label} open={open} onClose={() => setOpen(false)}>
        <form
          action={action}
          onSubmit={() => setOpen(false)}
          className="flex flex-col gap-4"
        >
          <p className="text-sm text-muted">{confirmMessage}</p>
          {children}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={variant}>
              {label}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function DeleteButton({
  action,
  id,
  label = "Delete",
  confirmMessage = "Delete this record?",
  compact = true,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label?: string;
  confirmMessage?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="danger"
        size={compact ? "xs" : "sm"}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <Modal title={label} open={open} onClose={() => setOpen(false)}>
        <form
          action={action}
          onSubmit={() => setOpen(false)}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="id" value={id} />
          <p className="text-sm text-muted">{confirmMessage}</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              {label}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
