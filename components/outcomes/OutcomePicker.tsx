"use client";

import type { Outcome } from "@/lib/types/outcome";

type Props = {
  outcomes: Outcome[];
  value: string | null;
  onChange: (outcomeId: string | null) => void;
  disabled?: boolean;
  id?: string;
  encourageLink?: boolean;
};

export function OutcomePicker({
  outcomes,
  value,
  onChange,
  disabled,
  id,
  encourageLink = true,
}: Props) {
  const openOutcomes = outcomes.filter((o) => o.status === "open");
  const doneOutcomes = outcomes.filter((o) => o.status === "done");
  const selectedDone =
    value && doneOutcomes.some((o) => o.id === value)
      ? doneOutcomes.find((o) => o.id === value)
      : null;

  return (
    <div className="flex flex-col gap-1">
      <select
        id={id}
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? e.target.value : null)}
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:opacity-60"
      >
        <option value="">No outcome linked</option>
        {openOutcomes.length > 0 && (
          <optgroup label="Open outcomes">
            {openOutcomes.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </optgroup>
        )}
        {selectedDone && (
          <optgroup label="Current (done)">
            <option value={selectedDone.id}>{selectedDone.title}</option>
          </optgroup>
        )}
        {doneOutcomes.length > 0 && (
          <optgroup label="Done outcomes">
            {doneOutcomes
              .filter((o) => o.id !== selectedDone?.id)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
          </optgroup>
        )}
      </select>
      {encourageLink && !value && (
        <p className="text-xs text-amber-700">
          Link a meaningful outcome so progress is visible later — not required,
          but strongly encouraged.
        </p>
      )}
      {outcomes.length === 0 && (
        <p className="text-xs text-zinc-500">
          No outcomes for this project yet. Create one on the project page.
        </p>
      )}
    </div>
  );
}
