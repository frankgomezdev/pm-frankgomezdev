export type OutcomeStatus = "open" | "done";

export type Outcome = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: OutcomeStatus;
  createdBy: string;
  createdAt: unknown;
  updatedAt: unknown;
};

export type OutcomeInput = {
  title: string;
  description: string;
  status: OutcomeStatus;
};

export const OUTCOME_STATUSES: { value: OutcomeStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "done", label: "Done" },
];
