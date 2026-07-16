import Link from "next/link";

type Props = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: Props) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-10 text-center">
      <p className="text-sm font-medium text-zinc-900">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
