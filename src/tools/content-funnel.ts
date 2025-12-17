import { z } from "zod";
import { createEntity, getEntity, updateEntity, listEntitiesByType } from "../storage/index.js";
import type { ContentFunnel } from "../schemas/index.js";

export const createContentFunnelSchema = z.object({
  projectId: z.string().describe("The project ID to add this funnel to"),
  name: z.string().describe("Name for this content funnel"),
  description: z.string().optional().describe("Optional description"),

  tofu: z.object({
    goal: z.string().describe("Goal for top of funnel content"),
    audience: z.string().optional().describe("Target audience at this stage"),
    contentTypes: z.array(z.object({
      type: z.string().describe("Content type (blog post, social media, video, etc.)"),
      topic: z.string().describe("Content topic"),
      format: z.string().optional().describe("Format details"),
      distributionChannel: z.string().optional().describe("Distribution channel"),
    })).describe("Content for awareness stage"),
    keywords: z.array(z.string()).optional().describe("Target keywords"),
    cta: z.string().optional().describe("CTA for TOFU content"),
    successMetrics: z.array(z.string()).optional().describe("Success metrics"),
  }).describe("Top of Funnel - Awareness content"),

  mofu: z.object({
    goal: z.string().describe("Goal for middle of funnel content"),
    nurturingStrategy: z.string().optional().describe("Lead nurturing strategy"),
    contentTypes: z.array(z.object({
      type: z.string().describe("Content type (ebook, webinar, case study, etc.)"),
      topic: z.string().describe("Content topic"),
      format: z.string().optional().describe("Format details"),
      gatingStrategy: z.enum(["gated", "ungated", "partial"]).optional().describe("Gating strategy"),
    })).describe("Content for consideration stage"),
    leadMagnets: z.array(z.object({
      name: z.string().describe("Lead magnet name"),
      type: z.string().describe("Type of lead magnet"),
      valueProposition: z.string().optional().describe("Value proposition"),
    })).optional().describe("Lead magnets offered"),
    emailSequences: z.array(z.object({
      name: z.string().describe("Sequence name"),
      emails: z.number().describe("Number of emails"),
      goal: z.string().optional().describe("Sequence goal"),
    })).optional().describe("Email nurturing sequences"),
    successMetrics: z.array(z.string()).optional().describe("Success metrics"),
  }).describe("Middle of Funnel - Consideration content"),

  bofu: z.object({
    goal: z.string().describe("Goal for bottom of funnel content"),
    contentTypes: z.array(z.object({
      type: z.string().describe("Content type (demo, trial, consultation, etc.)"),
      topic: z.string().describe("Content topic"),
      format: z.string().optional().describe("Format details"),
    })).describe("Content for decision stage"),
    salesEnablement: z.array(z.object({
      asset: z.string().describe("Sales asset name"),
      useCase: z.string().optional().describe("When to use this asset"),
    })).optional().describe("Sales enablement materials"),
    conversionTactics: z.array(z.string()).optional().describe("Conversion tactics"),
    pricingStrategy: z.string().optional().describe("Pricing presentation strategy"),
    successMetrics: z.array(z.string()).optional().describe("Success metrics"),
  }).describe("Bottom of Funnel - Decision content"),

  contentCalendar: z.array(z.object({
    stage: z.enum(["tofu", "mofu", "bofu"]).describe("Funnel stage"),
    contentPiece: z.string().describe("Content piece name"),
    publishDate: z.string().optional().describe("Planned publish date"),
    owner: z.string().optional().describe("Content owner"),
    status: z.enum(["planned", "in-progress", "review", "published"]).optional().describe("Status"),
  })).optional().describe("Content calendar"),
});

export async function createContentFunnel(
  args: z.infer<typeof createContentFunnelSchema>
): Promise<ContentFunnel> {
  return createEntity<ContentFunnel>(args.projectId, {
    type: "content-funnel",
    name: args.name,
    description: args.description,
    tofu: args.tofu,
    mofu: args.mofu,
    bofu: args.bofu,
    contentCalendar: args.contentCalendar,
  });
}

export const updateContentFunnelSchema = z.object({
  entityId: z.string().describe("The funnel ID to update"),
  name: z.string().optional().describe("Updated name"),
  description: z.string().optional().describe("Updated description"),
  tofu: createContentFunnelSchema.shape.tofu.optional(),
  mofu: createContentFunnelSchema.shape.mofu.optional(),
  bofu: createContentFunnelSchema.shape.bofu.optional(),
  contentCalendar: createContentFunnelSchema.shape.contentCalendar,
});

export async function updateContentFunnel(
  args: z.infer<typeof updateContentFunnelSchema>
): Promise<ContentFunnel> {
  const existing = await getEntity<ContentFunnel>(args.entityId);
  if (!existing) {
    throw new Error(`Content Funnel ${args.entityId} not found`);
  }

  const updated: ContentFunnel = {
    ...existing,
    name: args.name ?? existing.name,
    description: args.description ?? existing.description,
    tofu: args.tofu ?? existing.tofu,
    mofu: args.mofu ?? existing.mofu,
    bofu: args.bofu ?? existing.bofu,
    contentCalendar: args.contentCalendar ?? existing.contentCalendar,
  };

  return updateEntity(updated);
}

export async function getContentFunnel(entityId: string): Promise<ContentFunnel | null> {
  return getEntity<ContentFunnel>(entityId);
}

export async function listContentFunnels(projectId: string): Promise<ContentFunnel[]> {
  const entities = await listEntitiesByType(projectId, "content-funnel");
  return entities as ContentFunnel[];
}
