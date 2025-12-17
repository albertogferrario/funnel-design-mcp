import { z } from "zod";
import { createEntity, getEntity, updateEntity, listEntitiesByType } from "../storage/index.js";
import type { ConversionFunnel } from "../schemas/index.js";

export const createConversionFunnelSchema = z.object({
  projectId: z.string().describe("The project ID to add this funnel to"),
  name: z.string().describe("Name for this conversion funnel"),
  description: z.string().optional().describe("Optional description"),

  stages: z.array(z.object({
    name: z.string().describe("Stage name"),
    description: z.string().optional().describe("Stage description"),
    entryCriteria: z.string().optional().describe("Criteria to enter this stage"),
    exitCriteria: z.string().optional().describe("Criteria to exit this stage"),
    volume: z.number().optional().describe("Number of people at this stage"),
    conversionRate: z.number().min(0).max(100).optional().describe("Conversion rate to next stage (%)"),
    averageTimeInStage: z.string().optional().describe("Average time spent in this stage"),
    keyActions: z.array(z.string()).optional().describe("Key actions taken at this stage"),
    dropOffReasons: z.array(z.string()).optional().describe("Common reasons for drop-off"),
    optimizationNotes: z.string().optional().describe("Notes for optimization"),
  })).describe("Funnel stages from top to bottom"),

  trafficSources: z.array(z.object({
    source: z.string().describe("Traffic source name"),
    medium: z.string().optional().describe("Traffic medium"),
    volume: z.number().optional().describe("Traffic volume"),
    qualityScore: z.number().min(0).max(100).optional().describe("Traffic quality score"),
    cost: z.string().optional().describe("Cost for this source"),
    conversionRate: z.number().min(0).max(100).optional().describe("Conversion rate from this source"),
  })).optional().describe("Traffic sources feeding the funnel"),

  overallMetrics: z.object({
    totalVisitors: z.number().optional().describe("Total visitors entering funnel"),
    totalConversions: z.number().optional().describe("Total conversions"),
    overallConversionRate: z.number().min(0).max(100).optional().describe("Overall conversion rate"),
    averageDealValue: z.string().optional().describe("Average deal/order value"),
    customerAcquisitionCost: z.string().optional().describe("Customer acquisition cost"),
    timeToConversion: z.string().optional().describe("Average time to conversion"),
  }).optional().describe("Overall funnel metrics"),

  bottlenecks: z.array(z.object({
    stage: z.string().describe("Stage where bottleneck occurs"),
    issue: z.string().describe("Description of the bottleneck"),
    impact: z.enum(["high", "medium", "low"]).optional().describe("Impact level"),
    proposedSolution: z.string().optional().describe("Proposed solution"),
  })).optional().describe("Identified bottlenecks"),
});

export async function createConversionFunnel(
  args: z.infer<typeof createConversionFunnelSchema>
): Promise<ConversionFunnel> {
  return createEntity<ConversionFunnel>(args.projectId, {
    type: "conversion-funnel",
    name: args.name,
    description: args.description,
    stages: args.stages,
    trafficSources: args.trafficSources,
    overallMetrics: args.overallMetrics,
    bottlenecks: args.bottlenecks,
  });
}

export const updateConversionFunnelSchema = z.object({
  entityId: z.string().describe("The funnel ID to update"),
  name: z.string().optional().describe("Updated name"),
  description: z.string().optional().describe("Updated description"),
  stages: createConversionFunnelSchema.shape.stages.optional(),
  trafficSources: createConversionFunnelSchema.shape.trafficSources,
  overallMetrics: createConversionFunnelSchema.shape.overallMetrics,
  bottlenecks: createConversionFunnelSchema.shape.bottlenecks,
});

export async function updateConversionFunnel(
  args: z.infer<typeof updateConversionFunnelSchema>
): Promise<ConversionFunnel> {
  const existing = await getEntity<ConversionFunnel>(args.entityId);
  if (!existing) {
    throw new Error(`Conversion Funnel ${args.entityId} not found`);
  }

  const updated: ConversionFunnel = {
    ...existing,
    name: args.name ?? existing.name,
    description: args.description ?? existing.description,
    stages: args.stages ?? existing.stages,
    trafficSources: args.trafficSources ?? existing.trafficSources,
    overallMetrics: args.overallMetrics ?? existing.overallMetrics,
    bottlenecks: args.bottlenecks ?? existing.bottlenecks,
  };

  return updateEntity(updated);
}

export async function getConversionFunnel(entityId: string): Promise<ConversionFunnel | null> {
  return getEntity<ConversionFunnel>(entityId);
}

export async function listConversionFunnels(projectId: string): Promise<ConversionFunnel[]> {
  const entities = await listEntitiesByType(projectId, "conversion-funnel");
  return entities as ConversionFunnel[];
}
