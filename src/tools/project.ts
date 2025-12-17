import { z } from "zod";
import {
  createProject as createProjectStorage,
  getProject as getProjectStorage,
  updateProject as updateProjectStorage,
  deleteProject as deleteProjectStorage,
  listProjects as listProjectsStorage,
  listEntitiesByProject,
  deleteEntity,
  exportProjectToJson,
  exportProjectToMarkdown,
} from "../storage/index.js";
import type { Project, EntityType } from "../schemas/index.js";

export const createProjectSchema = z.object({
  name: z.string().describe("Name for the project"),
  description: z.string().optional().describe("Optional project description"),
  tags: z.array(z.string()).optional().describe("Optional tags for organization"),
});

export async function createProject(
  args: z.infer<typeof createProjectSchema>
): Promise<Project> {
  return createProjectStorage(args.name, args.description, args.tags);
}

export const getProjectSchema = z.object({
  projectId: z.string().describe("The project ID to retrieve"),
});

export async function getProject(
  args: z.infer<typeof getProjectSchema>
): Promise<{ project: Project; entities: EntityType[] } | null> {
  const project = await getProjectStorage(args.projectId);
  if (!project) return null;

  const entities = await listEntitiesByProject(args.projectId);
  return { project, entities };
}

export const updateProjectSchema = z.object({
  projectId: z.string().describe("The project ID to update"),
  name: z.string().optional().describe("Updated name"),
  description: z.string().optional().describe("Updated description"),
  tags: z.array(z.string()).optional().describe("Updated tags"),
});

export async function updateProject(
  args: z.infer<typeof updateProjectSchema>
): Promise<Project> {
  const existing = await getProjectStorage(args.projectId);
  if (!existing) {
    throw new Error(`Project ${args.projectId} not found`);
  }

  const updated: Project = {
    ...existing,
    name: args.name ?? existing.name,
    description: args.description ?? existing.description,
    tags: args.tags ?? existing.tags,
  };

  return updateProjectStorage(updated);
}

export const deleteProjectSchema = z.object({
  projectId: z.string().describe("The project ID to delete"),
});

export async function deleteProject(
  args: z.infer<typeof deleteProjectSchema>
): Promise<{ success: boolean; message: string }> {
  const success = await deleteProjectStorage(args.projectId);
  return {
    success,
    message: success
      ? `Project ${args.projectId} and all its entities deleted`
      : `Project ${args.projectId} not found`,
  };
}

export async function listProjects(): Promise<Project[]> {
  return listProjectsStorage();
}

export const deleteEntitySchema = z.object({
  entityId: z.string().describe("The entity ID to delete"),
});

export async function deleteEntityTool(
  args: z.infer<typeof deleteEntitySchema>
): Promise<{ success: boolean; message: string }> {
  const success = await deleteEntity(args.entityId);
  return {
    success,
    message: success
      ? `Entity ${args.entityId} deleted`
      : `Entity ${args.entityId} not found`,
  };
}

export const exportProjectSchema = z.object({
  projectId: z.string().describe("The project ID to export"),
  format: z.enum(["json", "markdown"]).describe("Export format"),
});

export async function exportProject(
  args: z.infer<typeof exportProjectSchema>
): Promise<string> {
  if (args.format === "json") {
    return exportProjectToJson(args.projectId);
  } else {
    return exportProjectToMarkdown(args.projectId);
  }
}

export const listProjectEntitiesSchema = z.object({
  projectId: z.string().describe("The project ID"),
  type: z
    .enum([
      "aida-funnel",
      "content-funnel",
      "conversion-funnel",
      "customer-journey",
    ])
    .optional()
    .describe("Filter by entity type"),
});

export async function listProjectEntities(
  args: z.infer<typeof listProjectEntitiesSchema>
): Promise<EntityType[]> {
  const entities = await listEntitiesByProject(args.projectId);
  if (args.type) {
    return entities.filter((e) => e.type === args.type);
  }
  return entities;
}
