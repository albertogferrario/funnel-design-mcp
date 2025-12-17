#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

type ToolContent = { type: "text"; text: string };
type ToolResponse = { content: ToolContent[]; isError?: boolean };

function jsonResponse(data: unknown): ToolResponse {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function errorResponse(message: string): ToolResponse {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

import {
  // Project management
  createProject,
  createProjectSchema,
  getProject,
  getProjectSchema,
  updateProject,
  updateProjectSchema,
  deleteProject,
  deleteProjectSchema,
  listProjects,
  deleteEntityTool,
  deleteEntitySchema,
  exportProject,
  exportProjectSchema,
  listProjectEntities,
  listProjectEntitiesSchema,
  // AIDA Funnel
  createAidaFunnel,
  createAidaFunnelSchema,
  updateAidaFunnel,
  updateAidaFunnelSchema,
  // Content Funnel (TOFU/MOFU/BOFU)
  createContentFunnel,
  createContentFunnelSchema,
  updateContentFunnel,
  updateContentFunnelSchema,
  // Conversion Funnel
  createConversionFunnel,
  createConversionFunnelSchema,
  updateConversionFunnel,
  updateConversionFunnelSchema,
  // Customer Journey
  createCustomerJourney,
  createCustomerJourneySchema,
  updateCustomerJourney,
  updateCustomerJourneySchema,
  // OpenAI Deep Research
  configureOpenAI,
  configureOpenAISchema,
  checkOpenAIConfig,
  deepResearch,
  deepResearchSchema,
  populateFramework,
  populateFrameworkSchema,
} from "./tools/index.js";

import { getEntity } from "./storage/index.js";

const server = new McpServer({
  name: "funnel-design",
  version: "1.0.0",
});

// ============================================================================
// PROJECT MANAGEMENT TOOLS
// ============================================================================

server.tool(
  "create_project",
  createProjectSchema.shape,
  { title: "Create a new funnel design project to organize your marketing funnels" },
  async (args) => jsonResponse(await createProject(createProjectSchema.parse(args)))
);

server.tool(
  "get_project",
  getProjectSchema.shape,
  { title: "Get a project with all its funnel entities" },
  async (args) => {
    const result = await getProject(getProjectSchema.parse(args));
    return result ? jsonResponse(result) : errorResponse("Project not found");
  }
);

server.tool(
  "update_project",
  updateProjectSchema.shape,
  { title: "Update project name, description, or tags" },
  async (args) => jsonResponse(await updateProject(updateProjectSchema.parse(args)))
);

server.tool(
  "delete_project",
  deleteProjectSchema.shape,
  { title: "Delete a project and all its funnels" },
  async (args) => jsonResponse(await deleteProject(deleteProjectSchema.parse(args)))
);

server.tool(
  "list_projects",
  {},
  { title: "List all funnel design projects" },
  async () => jsonResponse(await listProjects())
);

server.tool(
  "list_project_entities",
  listProjectEntitiesSchema.shape,
  { title: "List all funnels in a project, optionally filtered by type" },
  async (args) => jsonResponse(await listProjectEntities(listProjectEntitiesSchema.parse(args)))
);

server.tool(
  "delete_entity",
  deleteEntitySchema.shape,
  { title: "Delete any funnel entity by ID" },
  async (args) => jsonResponse(await deleteEntityTool(deleteEntitySchema.parse(args)))
);

server.tool(
  "export_project",
  exportProjectSchema.shape,
  { title: "Export a project to JSON or Markdown format" },
  async (args) => {
    const result = await exportProject(exportProjectSchema.parse(args));
    return { content: [{ type: "text" as const, text: result }] };
  }
);

server.tool(
  "get_entity",
  { entityId: z.string().describe("The entity ID to retrieve") },
  { title: "Get any funnel entity by ID" },
  async (args) => {
    const result = await getEntity(args.entityId);
    return result ? jsonResponse(result) : errorResponse("Entity not found");
  }
);

// ============================================================================
// AIDA FUNNEL
// ============================================================================

server.tool(
  "create_aida_funnel",
  createAidaFunnelSchema.shape,
  { title: "Create an AIDA Funnel (Attention, Interest, Desire, Action)" },
  async (args) => jsonResponse(await createAidaFunnel(createAidaFunnelSchema.parse(args)))
);

server.tool(
  "update_aida_funnel",
  updateAidaFunnelSchema.shape,
  { title: "Update an existing AIDA Funnel" },
  async (args) => jsonResponse(await updateAidaFunnel(updateAidaFunnelSchema.parse(args)))
);

// ============================================================================
// CONTENT FUNNEL (TOFU/MOFU/BOFU)
// ============================================================================

server.tool(
  "create_content_funnel",
  createContentFunnelSchema.shape,
  { title: "Create a Content Funnel (TOFU/MOFU/BOFU stages)" },
  async (args) => jsonResponse(await createContentFunnel(createContentFunnelSchema.parse(args)))
);

server.tool(
  "update_content_funnel",
  updateContentFunnelSchema.shape,
  { title: "Update an existing Content Funnel" },
  async (args) => jsonResponse(await updateContentFunnel(updateContentFunnelSchema.parse(args)))
);

// ============================================================================
// CONVERSION FUNNEL
// ============================================================================

server.tool(
  "create_conversion_funnel",
  createConversionFunnelSchema.shape,
  { title: "Create a Conversion Funnel with stage metrics and optimization" },
  async (args) => jsonResponse(await createConversionFunnel(createConversionFunnelSchema.parse(args)))
);

server.tool(
  "update_conversion_funnel",
  updateConversionFunnelSchema.shape,
  { title: "Update an existing Conversion Funnel" },
  async (args) => jsonResponse(await updateConversionFunnel(updateConversionFunnelSchema.parse(args)))
);

// ============================================================================
// CUSTOMER JOURNEY
// ============================================================================

server.tool(
  "create_customer_journey",
  createCustomerJourneySchema.shape,
  { title: "Create a Customer Journey Map with touchpoints and emotions" },
  async (args) => jsonResponse(await createCustomerJourney(createCustomerJourneySchema.parse(args)))
);

server.tool(
  "update_customer_journey",
  updateCustomerJourneySchema.shape,
  { title: "Update an existing Customer Journey Map" },
  async (args) => jsonResponse(await updateCustomerJourney(updateCustomerJourneySchema.parse(args)))
);

// ============================================================================
// OPENAI DEEP RESEARCH
// ============================================================================

server.tool(
  "configure_openai",
  configureOpenAISchema.shape,
  { title: "Configure OpenAI API key for Deep Research (alternative to OPENAI_API_KEY env var)" },
  async (args) => jsonResponse(await configureOpenAI(configureOpenAISchema.parse(args)))
);

server.tool(
  "check_openai_config",
  {},
  { title: "Check if OpenAI API key is configured" },
  async () => jsonResponse(await checkOpenAIConfig())
);

server.tool(
  "deep_research",
  deepResearchSchema.shape,
  { title: "Execute OpenAI Deep Research to gather real marketing data for a funnel framework" },
  async (args) => jsonResponse(await deepResearch(deepResearchSchema.parse(args)))
);

server.tool(
  "populate_framework",
  populateFrameworkSchema.shape,
  { title: "Create a funnel entity from Deep Research results with citations" },
  async (args) => jsonResponse(await populateFramework(populateFrameworkSchema.parse(args)))
);

// ============================================================================
// START SERVER
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Funnel Design MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
