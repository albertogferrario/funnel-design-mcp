import { promises as fs } from "fs";
import { join } from "path";
import type { Project, EntityType } from "../schemas/index.js";

export type StorageErrorCode =
  | "NOT_FOUND"
  | "WRITE_FAILED"
  | "READ_FAILED"
  | "DELETE_FAILED"
  | "INVALID_DATA";

export class StorageError extends Error {
  constructor(
    message: string,
    public code: StorageErrorCode,
    public cause?: unknown
  ) {
    super(message);
    this.name = "StorageError";
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function getDataDir(): string {
  return process.env.FUNNEL_DESIGN_DATA_DIR || join(process.cwd(), ".funnel-design");
}

function getProjectsDir(): string {
  return join(getDataDir(), "projects");
}

function getEntitiesDir(): string {
  return join(getDataDir(), "entities");
}

let initializedDataDir: string | null = null;

async function ensureDirectories(): Promise<void> {
  const currentDataDir = getDataDir();
  if (initializedDataDir === currentDataDir) return;

  await fs.mkdir(getProjectsDir(), { recursive: true });
  await fs.mkdir(getEntitiesDir(), { recursive: true });
  initializedDataDir = currentDataDir;
}

export function resetDirectoryInit(): void {
  initializedDataDir = null;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function timestamp(): string {
  return new Date().toISOString();
}

export async function createProject(
  name: string,
  description?: string,
  tags?: string[]
): Promise<Project> {
  await ensureDirectories();

  const project: Project = {
    id: generateId(),
    name,
    description,
    tags,
    createdAt: timestamp(),
    updatedAt: timestamp(),
    entities: [],
  };

  await fs.writeFile(
    join(getProjectsDir(), `${project.id}.json`),
    JSON.stringify(project, null, 2)
  );

  return project;
}

export async function getProject(projectId: string): Promise<Project | null> {
  await ensureDirectories();
  try {
    const data = await fs.readFile(join(getProjectsDir(), `${projectId}.json`), "utf-8");
    return JSON.parse(data) as Project;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return null;
    }
    throw new StorageError(
      `Failed to read project ${projectId}`,
      "READ_FAILED",
      error
    );
  }
}

export async function updateProject(project: Project): Promise<Project> {
  await ensureDirectories();
  project.updatedAt = timestamp();
  await fs.writeFile(
    join(getProjectsDir(), `${project.id}.json`),
    JSON.stringify(project, null, 2)
  );
  return project;
}

export async function deleteProject(projectId: string): Promise<boolean> {
  await ensureDirectories();
  const project = await getProject(projectId);
  if (!project) return false;

  await Promise.all(project.entities.map((ref) => deleteEntity(ref.id)));

  try {
    await fs.unlink(join(getProjectsDir(), `${projectId}.json`));
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return false;
    }
    throw new StorageError(
      `Failed to delete project ${projectId}`,
      "DELETE_FAILED",
      error
    );
  }
}

export async function listProjects(): Promise<Project[]> {
  await ensureDirectories();
  const files = await fs.readdir(getProjectsDir());
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  const projects = await Promise.all(
    jsonFiles.map(async (file) => {
      try {
        const data = await fs.readFile(join(getProjectsDir(), file), "utf-8");
        return JSON.parse(data) as Project;
      } catch (error) {
        console.error(`Failed to read project file ${file}:`, error);
        return null;
      }
    })
  );

  return projects
    .filter((p): p is Project => p !== null)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function createEntity<T extends EntityType>(
  projectId: string,
  entity: Omit<T, "id" | "projectId" | "createdAt" | "updatedAt">
): Promise<T> {
  await ensureDirectories();

  const project = await getProject(projectId);
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  const fullEntity = {
    ...entity,
    id: generateId(),
    projectId,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  } as T;

  await fs.writeFile(
    join(getEntitiesDir(), `${fullEntity.id}.json`),
    JSON.stringify(fullEntity, null, 2)
  );

  project.entities.push({
    id: fullEntity.id,
    type: fullEntity.type,
  });
  await updateProject(project);

  return fullEntity;
}

export async function getEntity<T extends EntityType>(entityId: string): Promise<T | null> {
  await ensureDirectories();
  try {
    const data = await fs.readFile(join(getEntitiesDir(), `${entityId}.json`), "utf-8");
    return JSON.parse(data) as T;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return null;
    }
    throw new StorageError(
      `Failed to read entity ${entityId}`,
      "READ_FAILED",
      error
    );
  }
}

export async function updateEntity<T extends EntityType>(entity: T): Promise<T> {
  await ensureDirectories();
  entity.updatedAt = timestamp();
  await fs.writeFile(
    join(getEntitiesDir(), `${entity.id}.json`),
    JSON.stringify(entity, null, 2)
  );
  return entity;
}

export async function deleteEntity(entityId: string): Promise<boolean> {
  await ensureDirectories();
  const entity = await getEntity(entityId);
  if (!entity) return false;

  const project = await getProject(entity.projectId);
  if (project) {
    project.entities = project.entities.filter((e) => e.id !== entityId);
    await updateProject(project);
  }

  try {
    await fs.unlink(join(getEntitiesDir(), `${entityId}.json`));
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return false;
    }
    throw new StorageError(
      `Failed to delete entity ${entityId}`,
      "DELETE_FAILED",
      error
    );
  }
}

export async function listEntitiesByProject(projectId: string): Promise<EntityType[]> {
  await ensureDirectories();
  const project = await getProject(projectId);
  if (!project) return [];

  const entities = await Promise.all(
    project.entities.map((ref) => getEntity(ref.id))
  );

  return entities.filter((e): e is EntityType => e !== null);
}

export async function listEntitiesByType(
  projectId: string,
  type: EntityType["type"]
): Promise<EntityType[]> {
  const entities = await listEntitiesByProject(projectId);
  return entities.filter((e) => e.type === type);
}

export async function exportProjectToJson(projectId: string): Promise<string> {
  const project = await getProject(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  const entities = await listEntitiesByProject(projectId);

  return JSON.stringify({ project, entities }, null, 2);
}

export async function exportProjectToMarkdown(projectId: string): Promise<string> {
  const project = await getProject(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  const entities = await listEntitiesByProject(projectId);

  let md = `# ${project.name}\n\n`;

  if (project.description) {
    md += `${project.description}\n\n`;
  }

  if (project.tags && project.tags.length > 0) {
    md += `**Tags:** ${project.tags.join(", ")}\n\n`;
  }

  md += `---\n\n`;

  for (const entity of entities) {
    md += formatEntityAsMarkdown(entity);
    md += `\n---\n\n`;
  }

  return md;
}

function formatEntityAsMarkdown(entity: EntityType): string {
  let md = "";

  switch (entity.type) {
    case "aida-funnel":
      md += `## AIDA Funnel: ${entity.name}\n\n`;
      if (entity.description) md += `${entity.description}\n\n`;

      md += `### Attention\n`;
      if (entity.attention.targetAudience) md += `**Target Audience:** ${entity.attention.targetAudience}\n\n`;
      md += `#### Channels\n`;
      for (const ch of entity.attention.channels) {
        md += `- **${ch.channel}**`;
        if (ch.tactic) md += ` - ${ch.tactic}`;
        if (ch.budget) md += ` (Budget: ${ch.budget})`;
        if (ch.expectedReach) md += ` | Reach: ${ch.expectedReach}`;
        md += `\n`;
      }
      if (entity.attention.hooks?.length) {
        md += `\n#### Hooks\n`;
        for (const hook of entity.attention.hooks) {
          md += `- ${hook.hook}`;
          if (hook.format) md += ` (${hook.format})`;
          md += `\n`;
        }
      }
      md += `\n`;

      md += `### Interest\n`;
      if (entity.interest.valueProposition) md += `**Value Proposition:** ${entity.interest.valueProposition}\n\n`;
      md += `#### Content Types\n`;
      for (const ct of entity.interest.contentTypes) {
        md += `- **${ct.type}**`;
        if (ct.purpose) md += ` - ${ct.purpose}`;
        if (ct.format) md += ` (${ct.format})`;
        md += `\n`;
      }
      if (entity.interest.painPointsAddressed?.length) {
        md += `\n**Pain Points Addressed:** ${entity.interest.painPointsAddressed.join(", ")}\n`;
      }
      md += `\n`;

      md += `### Desire\n`;
      md += `#### Benefits\n`;
      for (const ben of entity.desire.benefits) {
        md += `- **${ben.benefit}**`;
        if (ben.emotionalTrigger) md += ` (Trigger: ${ben.emotionalTrigger})`;
        md += `\n`;
      }
      if (entity.desire.socialProof?.length) {
        md += `\n#### Social Proof\n`;
        for (const sp of entity.desire.socialProof) {
          md += `- [${sp.type}] ${sp.content}\n`;
        }
      }
      if (entity.desire.objectionHandling?.length) {
        md += `\n#### Objection Handling\n`;
        for (const obj of entity.desire.objectionHandling) {
          md += `- **${obj.objection}** → ${obj.response}\n`;
        }
      }
      md += `\n`;

      md += `### Action\n`;
      md += `**Primary CTA:** ${entity.action.primaryCta.text}`;
      if (entity.action.primaryCta.destination) md += ` → ${entity.action.primaryCta.destination}`;
      md += `\n\n`;
      if (entity.action.secondaryCtas?.length) {
        md += `**Secondary CTAs:**\n`;
        for (const cta of entity.action.secondaryCtas) {
          md += `- ${cta.text}`;
          if (cta.destination) md += ` → ${cta.destination}`;
          md += `\n`;
        }
        md += `\n`;
      }
      if (entity.action.conversionGoal) md += `**Conversion Goal:** ${entity.action.conversionGoal}\n`;
      if (entity.action.expectedConversionRate) md += `**Expected Conversion Rate:** ${entity.action.expectedConversionRate}\n`;
      md += `\n`;
      break;

    case "content-funnel":
      md += `## Content Funnel: ${entity.name}\n\n`;
      if (entity.description) md += `${entity.description}\n\n`;

      md += `### Top of Funnel (TOFU)\n`;
      md += `**Goal:** ${entity.tofu.goal}\n\n`;
      if (entity.tofu.audience) md += `**Audience:** ${entity.tofu.audience}\n\n`;
      md += `#### Content\n`;
      for (const ct of entity.tofu.contentTypes) {
        md += `- **${ct.type}:** ${ct.topic}`;
        if (ct.format) md += ` (${ct.format})`;
        if (ct.distributionChannel) md += ` via ${ct.distributionChannel}`;
        md += `\n`;
      }
      if (entity.tofu.keywords?.length) md += `\n**Keywords:** ${entity.tofu.keywords.join(", ")}\n`;
      if (entity.tofu.cta) md += `**CTA:** ${entity.tofu.cta}\n`;
      md += `\n`;

      md += `### Middle of Funnel (MOFU)\n`;
      md += `**Goal:** ${entity.mofu.goal}\n\n`;
      if (entity.mofu.nurturingStrategy) md += `**Nurturing Strategy:** ${entity.mofu.nurturingStrategy}\n\n`;
      md += `#### Content\n`;
      for (const ct of entity.mofu.contentTypes) {
        md += `- **${ct.type}:** ${ct.topic}`;
        if (ct.format) md += ` (${ct.format})`;
        if (ct.gatingStrategy) md += ` [${ct.gatingStrategy}]`;
        md += `\n`;
      }
      if (entity.mofu.leadMagnets?.length) {
        md += `\n#### Lead Magnets\n`;
        for (const lm of entity.mofu.leadMagnets) {
          md += `- **${lm.name}** (${lm.type})`;
          if (lm.valueProposition) md += `: ${lm.valueProposition}`;
          md += `\n`;
        }
      }
      md += `\n`;

      md += `### Bottom of Funnel (BOFU)\n`;
      md += `**Goal:** ${entity.bofu.goal}\n\n`;
      md += `#### Content\n`;
      for (const ct of entity.bofu.contentTypes) {
        md += `- **${ct.type}:** ${ct.topic}`;
        if (ct.format) md += ` (${ct.format})`;
        md += `\n`;
      }
      if (entity.bofu.conversionTactics?.length) {
        md += `\n**Conversion Tactics:** ${entity.bofu.conversionTactics.join(", ")}\n`;
      }
      if (entity.bofu.pricingStrategy) md += `**Pricing Strategy:** ${entity.bofu.pricingStrategy}\n`;
      md += `\n`;
      break;

    case "conversion-funnel":
      md += `## Conversion Funnel: ${entity.name}\n\n`;
      if (entity.description) md += `${entity.description}\n\n`;

      md += `### Stages\n`;
      for (const stage of entity.stages) {
        md += `#### ${stage.name}\n`;
        if (stage.description) md += `${stage.description}\n\n`;
        if (stage.entryCriteria) md += `**Entry:** ${stage.entryCriteria}\n`;
        if (stage.exitCriteria) md += `**Exit:** ${stage.exitCriteria}\n`;
        if (stage.volume !== undefined) md += `**Volume:** ${stage.volume}\n`;
        if (stage.conversionRate !== undefined) md += `**Conversion Rate:** ${stage.conversionRate}%\n`;
        if (stage.averageTimeInStage) md += `**Avg Time:** ${stage.averageTimeInStage}\n`;
        if (stage.dropOffReasons?.length) {
          md += `**Drop-off Reasons:** ${stage.dropOffReasons.join(", ")}\n`;
        }
        if (stage.optimizationNotes) md += `**Optimization:** ${stage.optimizationNotes}\n`;
        md += `\n`;
      }

      if (entity.trafficSources?.length) {
        md += `### Traffic Sources\n`;
        for (const ts of entity.trafficSources) {
          md += `- **${ts.source}**`;
          if (ts.medium) md += ` (${ts.medium})`;
          if (ts.volume) md += ` - ${ts.volume} visitors`;
          if (ts.conversionRate) md += ` | ${ts.conversionRate}% conversion`;
          md += `\n`;
        }
        md += `\n`;
      }

      if (entity.overallMetrics) {
        md += `### Overall Metrics\n`;
        const om = entity.overallMetrics;
        if (om.totalVisitors) md += `- **Total Visitors:** ${om.totalVisitors}\n`;
        if (om.totalConversions) md += `- **Total Conversions:** ${om.totalConversions}\n`;
        if (om.overallConversionRate) md += `- **Overall Conversion Rate:** ${om.overallConversionRate}%\n`;
        if (om.averageDealValue) md += `- **Average Deal Value:** ${om.averageDealValue}\n`;
        if (om.customerAcquisitionCost) md += `- **CAC:** ${om.customerAcquisitionCost}\n`;
        md += `\n`;
      }

      if (entity.bottlenecks?.length) {
        md += `### Bottlenecks\n`;
        for (const bn of entity.bottlenecks) {
          md += `- **${bn.stage}:** ${bn.issue}`;
          if (bn.impact) md += ` (${bn.impact} impact)`;
          if (bn.proposedSolution) md += `\n  - Solution: ${bn.proposedSolution}`;
          md += `\n`;
        }
        md += `\n`;
      }
      break;

    case "customer-journey":
      md += `## Customer Journey: ${entity.name}\n\n`;
      if (entity.description) md += `${entity.description}\n\n`;
      if (entity.personaReference) md += `**Persona:** ${entity.personaReference}\n\n`;

      md += `### Stages\n`;
      for (const stage of entity.stages) {
        md += `#### ${stage.name}\n`;
        if (stage.description) md += `${stage.description}\n\n`;
        md += `**Customer Goal:** ${stage.customerGoal}\n`;
        if (stage.duration) md += `**Duration:** ${stage.duration}\n`;
        md += `\n`;

        md += `**Touchpoints:**\n`;
        for (const tp of stage.touchpoints) {
          md += `- ${tp.channel}: ${tp.interaction}`;
          if (tp.owner) md += ` (${tp.owner})`;
          md += `\n`;
        }

        if (stage.emotions) {
          md += `\n**Emotion:** ${stage.emotions.feeling}`;
          if (stage.emotions.intensity) md += ` (${stage.emotions.intensity})`;
          md += `\n`;
        }

        if (stage.painPoints?.length) {
          md += `**Pain Points:** ${stage.painPoints.join(", ")}\n`;
        }
        if (stage.opportunities?.length) {
          md += `**Opportunities:** ${stage.opportunities.join(", ")}\n`;
        }
        md += `\n`;
      }

      if (entity.momentsOfTruth?.length) {
        md += `### Moments of Truth\n`;
        for (const mot of entity.momentsOfTruth) {
          md += `- **${mot.stage}:** ${mot.moment}`;
          if (mot.importance) md += ` (${mot.importance})`;
          md += `\n`;
          if (mot.currentExperience) md += `  - Current: ${mot.currentExperience}\n`;
          if (mot.desiredExperience) md += `  - Desired: ${mot.desiredExperience}\n`;
        }
        md += `\n`;
      }

      if (entity.improvements?.length) {
        md += `### Improvements\n`;
        for (const imp of entity.improvements) {
          md += `- **${imp.stage}:** ${imp.improvement}`;
          if (imp.priority) md += ` [${imp.priority}]`;
          if (imp.expectedImpact) md += ` → ${imp.expectedImpact}`;
          md += `\n`;
        }
        md += `\n`;
      }
      break;
  }

  return md;
}

export { formatEntityAsMarkdown };
