import type { LucideIcon } from "lucide-react";

/** Consistent empty state. */
export function Empty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-ink-300 bg-ink-50/60 px-6 py-10 text-center">
      {Icon ? (
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-ink-100 text-ink-500">
          <Icon size={20} aria-hidden="true" />
        </span>
      ) : null}
      <p className="mt-3 font-display text-base text-ink-900">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
