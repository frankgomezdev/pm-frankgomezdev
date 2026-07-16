export type ProjectStatus = "active" | "archived";

export type Project = {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  createdBy: string;
  createdAt: unknown;
  updatedAt: unknown;
};

export type ProjectInput = {
  title: string;
  description: string;
};
