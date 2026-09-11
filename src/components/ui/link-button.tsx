import Link from "next/link";
import { buttonVariants } from "@heroui/react";

/**
 * A Next.js Link styled as a HeroUI button.
 *
 * Navigation should render an <a>, not a <button> — this keeps middle-click,
 * "open in new tab" and screen-reader semantics correct while reusing HeroUI's
 * exact button styling via its exported variants.
 */
export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  prefetch,
}: {
  href: string;
  children: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "ghost"
    | "outline"
    | "danger"
    | "danger-soft";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  prefetch?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={buttonVariants({ variant, size, fullWidth, className })}
    >
      {children}
    </Link>
  );
}
