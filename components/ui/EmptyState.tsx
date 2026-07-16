import { Button } from "@/components/catalyst/button";
import { Subheading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";

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
    <div className="rounded-xl border border-dashed border-zinc-950/10 px-6 py-10 text-center dark:border-white/10">
      <Subheading level={3}>{title}</Subheading>
      <Text className="mx-auto mt-1 max-w-md">{description}</Text>
      {actionHref && actionLabel ? (
        <Button href={actionHref} className="mt-4">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
