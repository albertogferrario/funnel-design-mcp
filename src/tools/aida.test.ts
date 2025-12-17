import { describe, it, expect, beforeEach } from "vitest";
import {
  createAidaFunnel,
  updateAidaFunnel,
  getAidaFunnel,
  listAidaFunnels,
} from "./aida.js";
import { createProject } from "../storage/index.js";

describe("AIDA Funnel", () => {
  let projectId: string;

  beforeEach(async () => {
    const project = await createProject("Test Project");
    projectId = project.id;
  });

  it("should create a complete AIDA funnel", async () => {
    const funnel = await createAidaFunnel({
      projectId,
      name: "My AIDA Funnel",
      description: "A complete marketing funnel",
      attention: {
        channels: [
          { channel: "Social Media", tactic: "Paid ads", budget: "$5000/mo", expectedReach: "100K" },
          { channel: "Search", tactic: "Google Ads", budget: "$3000/mo" },
        ],
        hooks: [
          { hook: "Stop wasting time on manual tasks", format: "headline" },
          { hook: "See the transformation in 60 seconds", format: "video" },
        ],
        targetAudience: "Small business owners aged 25-45",
      },
      interest: {
        contentTypes: [
          { type: "Blog posts", purpose: "SEO and education", format: "Long-form" },
          { type: "Videos", purpose: "Engagement", format: "How-to tutorials" },
        ],
        engagementTactics: ["Email newsletter", "Free webinars"],
        valueProposition: "Save 10 hours per week with automation",
        painPointsAddressed: ["Manual data entry", "Inconsistent processes"],
      },
      desire: {
        socialProof: [
          { type: "testimonial", content: "This product changed our workflow completely" },
          { type: "case-study", content: "Company X increased efficiency by 40%" },
        ],
        benefits: [
          { benefit: "Time savings", emotionalTrigger: "Freedom" },
          { benefit: "Error reduction", emotionalTrigger: "Peace of mind" },
        ],
        urgencyTactics: ["Limited time offer", "Early bird pricing"],
        objectionHandling: [
          { objection: "Too expensive", response: "Calculate ROI over 6 months" },
        ],
      },
      action: {
        primaryCta: { text: "Start Free Trial", destination: "/signup", placement: "Above fold" },
        secondaryCtas: [
          { text: "Book a Demo", destination: "/demo" },
          { text: "View Pricing", destination: "/pricing" },
        ],
        frictionReducers: ["No credit card required", "14-day free trial"],
        conversionGoal: "Free trial signup",
        expectedConversionRate: "3-5%",
      },
      metrics: {
        awarenessKpis: ["Impressions", "Reach", "Brand searches"],
        engagementKpis: ["Time on page", "Email open rate", "Video completion"],
        conversionKpis: ["Trial signups", "Demo bookings", "Conversion rate"],
      },
    });

    expect(funnel.id).toBeDefined();
    expect(funnel.type).toBe("aida-funnel");
    expect(funnel.name).toBe("My AIDA Funnel");
    expect(funnel.attention.channels).toHaveLength(2);
    expect(funnel.interest.contentTypes).toHaveLength(2);
    expect(funnel.desire.benefits).toHaveLength(2);
    expect(funnel.action.primaryCta.text).toBe("Start Free Trial");
  });

  it("should create a minimal AIDA funnel", async () => {
    const funnel = await createAidaFunnel({
      projectId,
      name: "Minimal Funnel",
      attention: {
        channels: [{ channel: "Social Media" }],
      },
      interest: {
        contentTypes: [{ type: "Blog" }],
      },
      desire: {
        benefits: [{ benefit: "Saves time" }],
      },
      action: {
        primaryCta: { text: "Buy Now" },
      },
    });

    expect(funnel.id).toBeDefined();
    expect(funnel.attention.hooks).toBeUndefined();
    expect(funnel.desire.socialProof).toBeUndefined();
  });

  it("should update an AIDA funnel", async () => {
    const created = await createAidaFunnel({
      projectId,
      name: "Original",
      attention: { channels: [{ channel: "Original" }] },
      interest: { contentTypes: [{ type: "Original" }] },
      desire: { benefits: [{ benefit: "Original" }] },
      action: { primaryCta: { text: "Original CTA" } },
    });

    const updated = await updateAidaFunnel({
      entityId: created.id,
      name: "Updated Name",
      attention: {
        channels: [
          { channel: "Updated 1" },
          { channel: "Updated 2" },
        ],
      },
    });

    expect(updated.name).toBe("Updated Name");
    expect(updated.attention.channels).toHaveLength(2);
    expect(updated.interest.contentTypes[0].type).toBe("Original");
  });

  it("should throw when updating non-existent funnel", async () => {
    await expect(
      updateAidaFunnel({
        entityId: "non-existent",
        name: "Test",
      })
    ).rejects.toThrow("AIDA Funnel non-existent not found");
  });

  it("should get an AIDA funnel by ID", async () => {
    const created = await createAidaFunnel({
      projectId,
      name: "Test Funnel",
      attention: { channels: [{ channel: "Test" }] },
      interest: { contentTypes: [{ type: "Test" }] },
      desire: { benefits: [{ benefit: "Test" }] },
      action: { primaryCta: { text: "Test" } },
    });

    const retrieved = await getAidaFunnel(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(created.id);
  });

  it("should list AIDA funnels in a project", async () => {
    await createAidaFunnel({
      projectId,
      name: "Funnel 1",
      attention: { channels: [{ channel: "Test" }] },
      interest: { contentTypes: [{ type: "Test" }] },
      desire: { benefits: [{ benefit: "Test" }] },
      action: { primaryCta: { text: "Test" } },
    });

    await createAidaFunnel({
      projectId,
      name: "Funnel 2",
      attention: { channels: [{ channel: "Test" }] },
      interest: { contentTypes: [{ type: "Test" }] },
      desire: { benefits: [{ benefit: "Test" }] },
      action: { primaryCta: { text: "Test" } },
    });

    const funnels = await listAidaFunnels(projectId);

    expect(funnels).toHaveLength(2);
  });
});
