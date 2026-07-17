"use client";

import { Select } from "@/components/catalyst/select";
import type { Outcome } from "@/lib/types/outcome";

type Props = {
  outcomes: Outcome[];
  value: string | null;
  onChange: (outcomeId: string | null) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  encourageLink?: boolean;
};

export function OutcomePicker({
  outcomes,
  value,
  onChange,
  disabled,
  id,
  name = "outcomeId",
  encourageLink = true,
}: Props) {
  // Flat options (no optgroup) so the controlled value always matches a real
  // <option> — some browsers mishandle controlled <select> + <optgroup>.
  const openOutcomes = outcomes.filter((o) => o.status === "open");
  const doneOutcomes = outcomes.filter((o) => o.status === "done");

  return (
    <div className="flex flex-col gap-1.5">
      <Select
        id={id}
        name={name}
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? e.target.value : null)}
      >
        <option value="">No outcome linked</option>
        {openOutcomes.map((o) => (
          <option key={o.id} value={o.id}>
            {o.title}
          </option>
        ))}
        {doneOutcomes.map((o) => (
          <option key={o.id} value={o.id}>
            {o.title} (done)
          </option>
        ))}
      </Select>
      {encourageLink && !value && (
        <p className="text-xs/5 text-amber-700 dark:text-amber-500">
          Link a meaningful outcome so progress is visible later. Not required,
          but strongly encouraged.
        </p>
      )}
      {outcomes.length === 0 && (
        <p className="text-xs/5 text-zinc-500 dark:text-zinc-400">
          No outcomes for this project yet. Create one on the project page.
        </p>
      )}
    </div>
  );
}
