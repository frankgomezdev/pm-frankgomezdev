import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import type { Project, ProjectInput, ProjectStatus } from "@/lib/types/project";

function mapProject(id: string, data: Record<string, unknown>): Project {
  return {
    id,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    status: (data.status as ProjectStatus) ?? "active",
    createdBy: String(data.createdBy ?? ""),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function listProjects(): Promise<Project[]> {
  const q = query(
    collection(getFirestoreDb(), "projects"),
    orderBy("updatedAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapProject(d.id, d.data()));
}

export async function getProject(projectId: string): Promise<Project | null> {
  const snap = await getDoc(doc(getFirestoreDb(), "projects", projectId));
  if (!snap.exists()) return null;
  return mapProject(snap.id, snap.data());
}

export async function createProject(
  input: ProjectInput,
  uid: string,
): Promise<string> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Project title is required.");
  }

  const ref = await addDoc(collection(getFirestoreDb(), "projects"), {
    title,
    description: input.description.trim(),
    status: "active" satisfies ProjectStatus,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProject(
  projectId: string,
  input: ProjectInput,
): Promise<void> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Project title is required.");
  }

  await updateDoc(doc(getFirestoreDb(), "projects", projectId), {
    title,
    description: input.description.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function setProjectStatus(
  projectId: string,
  status: ProjectStatus,
): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), "projects", projectId), {
    status,
    updatedAt: serverTimestamp(),
  });
}
