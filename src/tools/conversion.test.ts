import { describe, it, expect, beforeEach } from "vitest";
import {
  createConversionFunnel,
  updateConversionFunnel,
  getConversionFunnel,
  listConversionFunnels,
} from "./conversion.js";
import { createProject } from "../storage/index.js";

describe("Conversion Funnel", () => {
  let projectId: string;

  beforeEach(async () => {
    const project = await createProject("Test Project");
    projectId = project.id;
  });

  it("should create a complete conversion funnel", async () => {
    const funnel = await createConversionFunnel({
      projectId,
      name: "E-commerce Funnel",
      description: "Main conversion funnel for online store",
      stages: [
        {
          name: "Visitors",
          description: "All website visitors",
          entryCriteria: "Page view",
          exitCriteria: "View product",
          volume: 10000,
          conversionRate: 40,
          averageTimeInStage: "30 seconds",
          keyActions: ["Browse categories", "Use search"],
          dropOffReasons: ["Poor UX", "Slow loading"],
        },
        {
          name: "Product Viewers",
          description: "Viewed product pages",
          entryCriteria: "Product page view",
          exitCriteria: "Add to cart",
          volume: 4000,
          conversionRate: 25,
          averageTimeInStage: "2 minutes",
          keyActions: ["Read descriptions", "View images"],
          dropOffReasons: ["Price", "Lack of reviews"],
        },
        {
          name: "Cart",
          description: "Added to cart",
          entryCriteria: "Add to cart action",
          exitCriteria: "Begin checkout",
          volume: 1000,
          conversionRate: 60,
          averageTimeInStage: "5 minutes",
          keyActions: ["Adjust quantity", "View cart"],
          dropOffReasons: ["Shipping costs", "Comparison shopping"],
        },
        {
          name: "Checkout",
          description: "In checkout process",
          entryCriteria: "Begin checkout",
          exitCriteria: "Complete purchase",
          volume: 600,
          conversionRate: 70,
          averageTimeInStage: "3 minutes",
          keyActions: ["Enter details", "Choose payment"],
          dropOffReasons: ["Complex form", "Payment issues"],
        },
        {
          name: "Purchasers",
          description: "Completed purchase",
          volume: 420,
        },
      ],
      trafficSources: [
        { source: "Google", medium: "organic", volume: 4000, conversionRate: 5 },
        { source: "Google", medium: "cpc", volume: 3000, qualityScore: 80, cost: "$5000", conversionRate: 4 },
        { source: "Facebook", medium: "social", volume: 2000, conversionRate: 3 },
        { source: "Direct", volume: 1000, conversionRate: 8 },
      ],
      overallMetrics: {
        totalVisitors: 10000,
        totalConversions: 420,
        overallConversionRate: 4.2,
        averageDealValue: "$85",
        customerAcquisitionCost: "$25",
        timeToConversion: "1-2 days",
      },
      bottlenecks: [
        {
          stage: "Product Viewers",
          issue: "Low conversion to cart",
          impact: "high",
          proposedSolution: "Add trust badges and reviews",
        },
        {
          stage: "Cart",
          issue: "Cart abandonment",
          impact: "high",
          proposedSolution: "Implement cart abandonment emails",
        },
      ],
    });

    expect(funnel.id).toBeDefined();
    expect(funnel.type).toBe("conversion-funnel");
    expect(funnel.name).toBe("E-commerce Funnel");
    expect(funnel.stages).toHaveLength(5);
    expect(funnel.trafficSources).toHaveLength(4);
    expect(funnel.overallMetrics?.overallConversionRate).toBe(4.2);
    expect(funnel.bottlenecks).toHaveLength(2);
  });

  it("should create a minimal conversion funnel", async () => {
    const funnel = await createConversionFunnel({
      projectId,
      name: "Simple Funnel",
      stages: [
        { name: "Top" },
        { name: "Middle" },
        { name: "Bottom" },
      ],
    });

    expect(funnel.id).toBeDefined();
    expect(funnel.stages).toHaveLength(3);
    expect(funnel.trafficSources).toBeUndefined();
  });

  it("should update a conversion funnel", async () => {
    const created = await createConversionFunnel({
      projectId,
      name: "Original",
      stages: [{ name: "Original Stage" }],
    });

    const updated = await updateConversionFunnel({
      entityId: created.id,
      name: "Updated Name",
      stages: [
        { name: "Stage 1", conversionRate: 50 },
        { name: "Stage 2", conversionRate: 30 },
      ],
      overallMetrics: {
        totalVisitors: 1000,
        totalConversions: 150,
      },
    });

    expect(updated.name).toBe("Updated Name");
    expect(updated.stages).toHaveLength(2);
    expect(updated.overallMetrics?.totalVisitors).toBe(1000);
  });

  it("should throw when updating non-existent funnel", async () => {
    await expect(
      updateConversionFunnel({
        entityId: "non-existent",
        name: "Test",
      })
    ).rejects.toThrow("Conversion Funnel non-existent not found");
  });

  it("should get a conversion funnel by ID", async () => {
    const created = await createConversionFunnel({
      projectId,
      name: "Test Funnel",
      stages: [{ name: "Test" }],
    });

    const retrieved = await getConversionFunnel(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(created.id);
  });

  it("should list conversion funnels in a project", async () => {
    await createConversionFunnel({
      projectId,
      name: "Funnel 1",
      stages: [{ name: "Stage 1" }],
    });

    await createConversionFunnel({
      projectId,
      name: "Funnel 2",
      stages: [{ name: "Stage 1" }],
    });

    const funnels = await listConversionFunnels(projectId);

    expect(funnels).toHaveLength(2);
  });
});
