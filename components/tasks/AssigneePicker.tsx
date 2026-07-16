"use client";

import { Select } from "@/components/catalyst/select";
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
    <Select
      id={id}
      disabled={disabled}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? e.target.value : null)}
    >
      <option value="">Unassigned</option>
      {users.map((user) => (
        <option key={user.uid} value={user.uid}>
          {formatUserLabel(user)}
        </option>
      ))}
    </Select>
  );
}
