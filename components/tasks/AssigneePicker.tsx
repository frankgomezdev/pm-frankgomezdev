"use client";

import {
  formatUserLabel,
  type CohortUser,
} from "@/lib/users/api";

type Props = {
  users: CohortUser[];
  value: string | null;
  onChange: (assigneeId: string | null) => void;
  disabled?: boolean;
  id?: string;
};

export function AssigneePicker({
  users,
  value,
  onChange,
  disabled,
  id,
}: Props) {
  return (
    <select
      id={id}
      disabled={disabled}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? e.target.value : null)}
      className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:opacity-60"
    >
      <option value="">Unassigned</option>
      {users.map((user) => (
        <option key={user.uid} value={user.uid}>
          {formatUserLabel(user)}
        </option>
      ))}
    </select>
  );
}
