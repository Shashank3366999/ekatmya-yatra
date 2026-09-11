import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** Screen title with an optional back affordance, matching the mobile mockups. */
export function PageTitle({
  title,
  description,
  backHref,
  action,
}: {
  title: string;
  description?: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {backHref ? (
        <Link
          href={backHref}
          className="-ml-2 grid size-10 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200"
          aria-label="Back"
        >
          <ChevronLeft size={19} aria-hidden="true" />
        </Link>
      ) : null}

      <div className="min-w-0 flex-1">
        <h1 className="font-display text-xl leading-tight text-ink-900">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-ink-500">{description}</p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
