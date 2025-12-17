import { describe, it, expect } from "vitest";
import {
  createProject,
  getProject,
  updateProject,
  deleteProject,
  listProjects,
  createEntity,
  getEntity,
  updateEntity,
  deleteEntity,
  listEntitiesByProject,
  listEntitiesByType,
  exportProjectToJson,
  exportProjectToMarkdown,
} from "./index.js";
import type { AidaFunnel, ConversionFunnel } from "../schemas/index.js";

describe("Storage Layer", () => {
  describe("Project Operations", () => {
    it("should create a project", async () => {
      const project = await createProject("Test Project", "A test project", ["test", "demo"]);

      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.name).toBe("Test Project");
      expect(project.description).toBe("A test project");
      expect(project.tags).toEqual(["test", "demo"]);
      expect(project.entities).toEqual([]);
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
    });

    it("should create a project without optional fields", async () => {
      const project = await createProject("Minimal Project");

      expect(project.name).toBe("Minimal Project");
      expect(project.description).toBeUndefined();
      expect(project.tags).toBeUndefined();
    });

    it("should get an existing project", async () => {
      const created = await createProject("Test Project");
      const retrieved = await getProject(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe("Test Project");
    });

    it("should return null for non-existent project", async () => {
      const result = await getProject("non-existent-id");
      expect(result).toBeNull();
    });

    it("should update a project", async () => {
      const created = await createProject("Original Name");
      await new Promise((r) => setTimeout(r, 10));
      const updated = await updateProject({
        ...created,
        name: "Updated Name",
        description: "New description",
      });

      expect(updated.name).toBe("Updated Name");
      expect(updated.description).toBe("New description");
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
        new Date(created.updatedAt).getTime()
      );
    });

    it("should delete a project", async () => {
      const created = await createProject("To Delete");
      const deleted = await deleteProject(created.id);

      expect(deleted).toBe(true);

      const retrieved = await getProject(created.id);
      expect(retrieved).toBeNull();
    });

    it("should return false when deleting non-existent project", async () => {
      const result = await deleteProject("non-existent-id");
      expect(result).toBe(false);
    });

    it("should list all projects", async () => {
      await createProject("Project 1");
      await createProject("Project 2");
      await createProject("Project 3");

      const projects = await listProjects();

      expect(projects).toHaveLength(3);
    });

    it("should list projects sorted by updated date (newest first)", async () => {
      const p1 = await createProject("Project 1");
      await createProject("Project 2");
      await updateProject({ ...p1, name: "Project 1 Updated" });

      const projects = await listProjects();

      expect(projects[0].name).toBe("Project 1 Updated");
    });
  });

  describe("Entity Operations", () => {
    it("should create an entity within a project", async () => {
      const project = await createProject("Test Project");

      const entity = await createEntity<ConversionFunnel>(project.id, {
        type: "conversion-funnel",
        name: "Test Funnel",
        stages: [
          { name: "Awareness", entryCriteria: "First visit" },
          { name: "Interest", entryCriteria: "Engaged content" },
        ],
      });

      expect(entity.id).toBeDefined();
      expect(entity.projectId).toBe(project.id);
      expect(entity.type).toBe("conversion-funnel");
      expect(entity.name).toBe("Test Funnel");
    });

    it("should add entity reference to project", async () => {
      const project = await createProject("Test Project");

      await createEntity<ConversionFunnel>(project.id, {
        type: "conversion-funnel",
        name: "Test Funnel",
        stages: [],
      });

      const updatedProject = await getProject(project.id);
      expect(updatedProject?.entities).toHaveLength(1);
      expect(updatedProject?.entities[0].type).toBe("conversion-funnel");
    });

    it("should throw when creating entity for non-existent project", async () => {
      await expect(
        createEntity<ConversionFunnel>("non-existent", {
          type: "conversion-funnel",
          name: "Test",
          stages: [],
        })
      ).rejects.toThrow("Project non-existent not found");
    });

    it("should get an existing entity", async () => {
      const project = await createProject("Test Project");
      const created = await createEntity<ConversionFunnel>(project.id, {
        type: "conversion-funnel",
        name: "Test Funnel",
        stages: [{ name: "Stage 1" }],
      });

      const retrieved = await getEntity<ConversionFunnel>(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.stages).toHaveLength(1);
    });

    it("should return null for non-existent entity", async () => {
      const result = await getEntity("non-existent");
      expect(result).toBeNull();
    });

    it("should update an entity", async () => {
      const project = await createProject("Test Project");
      const created = await createEntity<ConversionFunnel>(project.id, {
        type: "conversion-funnel",
        name: "Original",
        stages: [],
      });

      const updated = await updateEntity({
        ...created,
        name: "Updated",
        stages: [{ name: "New Stage" }],
      });

      expect(updated.name).toBe("Updated");
      expect(updated.stages).toHaveLength(1);
    });

    it("should delete an entity", async () => {
      const project = await createProject("Test Project");
      const entity = await createEntity<ConversionFunnel>(project.id, {
        type: "conversion-funnel",
        name: "To Delete",
        stages: [],
      });

      const deleted = await deleteEntity(entity.id);
      expect(deleted).toBe(true);

      const retrieved = await getEntity(entity.id);
      expect(retrieved).toBeNull();

      const updatedProject = await getProject(project.id);
      expect(updatedProject?.entities).toHaveLength(0);
    });

    it("should delete entities when project is deleted", async () => {
      const project = await createProject("Test Project");
      const entity = await createEntity<ConversionFunnel>(project.id, {
        type: "conversion-funnel",
        name: "Test",
        stages: [],
      });

      await deleteProject(project.id);

      const retrieved = await getEntity(entity.id);
      expect(retrieved).toBeNull();
    });

    it("should list entities by project", async () => {
      const project = await createProject("Test Project");

      await createEntity<ConversionFunnel>(project.id, {
        type: "conversion-funnel",
        name: "Funnel 1",
        stages: [],
      });

      await createEntity<ConversionFunnel>(project.id, {
        type: "conversion-funnel",
        name: "Funnel 2",
        stages: [],
      });

      const entities = await listEntitiesByProject(project.id);
      expect(entities).toHaveLength(2);
    });

    it("should list entities by type", async () => {
      const project = await createProject("Test Project");

      await createEntity<ConversionFunnel>(project.id, {
        type: "conversion-funnel",
        name: "Conversion",
        stages: [],
      });

      await createEntity<AidaFunnel>(project.id, {
        type: "aida-funnel",
        name: "AIDA",
        attention: { channels: [] },
        interest: { contentTypes: [] },
        desire: { benefits: [] },
        action: { primaryCta: { text: "Buy Now" } },
      });

      const conversionFunnels = await listEntitiesByType(project.id, "conversion-funnel");
      expect(conversionFunnels).toHaveLength(1);
      expect(conversionFunnels[0].type).toBe("conversion-funnel");
    });
  });

  describe("Export Operations", () => {
    it("should export project to JSON", async () => {
      const project = await createProject("Export Test", "Test description");
      await createEntity<ConversionFunnel>(project.id, {
        type: "conversion-funnel",
        name: "Test Funnel",
        stages: [{ name: "Stage 1" }],
      });

      const json = await exportProjectToJson(project.id);
      const parsed = JSON.parse(json);

      expect(parsed.project.name).toBe("Export Test");
      expect(parsed.entities).toHaveLength(1);
      expect(parsed.entities[0].type).toBe("conversion-funnel");
    });

    it("should export project to Markdown", async () => {
      const project = await createProject("Export Test", "Test description");
      await createEntity<ConversionFunnel>(project.id, {
        type: "conversion-funnel",
        name: "Test Funnel",
        stages: [
          { name: "Awareness", conversionRate: 50 },
          { name: "Interest", conversionRate: 30 },
        ],
      });

      const markdown = await exportProjectToMarkdown(project.id);

      expect(markdown).toContain("# Export Test");
      expect(markdown).toContain("Test description");
      expect(markdown).toContain("## Conversion Funnel: Test Funnel");
      expect(markdown).toContain("### Stages");
      expect(markdown).toContain("Awareness");
    });

    it("should throw when exporting non-existent project", async () => {
      await expect(exportProjectToJson("non-existent")).rejects.toThrow(
        "Project non-existent not found"
      );
    });
  });
});
