"use client";

import { useFormStatus } from "react-dom";
import { Button, Spinner } from "@heroui/react";

/**
 * Submit button wired to the enclosing form's pending state, so every form gets
 * disabled-while-submitting behaviour without per-form state.
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  fullWidth = false,
  size = "md",
  name,
  value,
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "tertiary" | "ghost" | "outline" | "danger" | "danger-soft";
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  name?: string;
  value?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      isDisabled={pending}
      name={name}
      value={value}
      className={className}
    >
      {pending ? (
        <>
          <Spinner size="sm" aria-hidden="true" />
          {pendingLabel ?? "Working…"}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
