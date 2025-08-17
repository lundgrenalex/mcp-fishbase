#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { FishBaseAPI } from "./fishbase-api.js";

const server = new Server(
  {
    name: "mcp-fishbase",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const fishbaseAPI = new FishBaseAPI();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_species",
        description: "Get species information from FishBase",
        inputSchema: {
          type: "object",
          properties: {
            species_name: {
              type: "string",
              description: "Scientific name of the species (e.g., 'Salmo trutta')",
            },
            fields: {
              type: "array",
              items: { type: "string" },
              description: "Optional list of specific fields to return",
            },
          },
          required: ["species_name"],
        },
      },
      {
        name: "search_species",
        description: "Search for species by common name or partial scientific name",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search term (common name or partial scientific name)",
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (default: 20)",
              default: 20,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_ecology",
        description: "Get ecological information for a species",
        inputSchema: {
          type: "object",
          properties: {
            species_name: {
              type: "string",
              description: "Scientific name of the species",
            },
          },
          required: ["species_name"],
        },
      },
      {
        name: "get_distribution",
        description: "Get distribution/occurrence information for a species",
        inputSchema: {
          type: "object",
          properties: {
            species_name: {
              type: "string",
              description: "Scientific name of the species",
            },
          },
          required: ["species_name"],
        },
      },
      {
        name: "get_morphology",
        description: "Get morphological and physiological data for a species",
        inputSchema: {
          type: "object",
          properties: {
            species_name: {
              type: "string",
              description: "Scientific name of the species",
            },
          },
          required: ["species_name"],
        },
      },
      {
        name: "validate_species_name",
        description: "Validate and correct species scientific names",
        inputSchema: {
          type: "object",
          properties: {
            species_name: {
              type: "string",
              description: "Scientific name to validate",
            },
          },
          required: ["species_name"],
        },
      },
      {
        name: "common_to_scientific",
        description: "Convert common name to scientific name",
        inputSchema: {
          type: "object",
          properties: {
            common_name: {
              type: "string",
              description: "Common name of the fish",
            },
          },
          required: ["common_name"],
        },
      },
      {
        name: "list_tables",
        description: "List all available FishBase tables",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new McpError(ErrorCode.InvalidParams, "Missing arguments");
  }

  try {
    switch (name) {
      case "get_species":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await fishbaseAPI.getSpecies(args.species_name as string, args.fields as string[]),
                null,
                2
              ),
            },
          ],
        };

      case "search_species":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await fishbaseAPI.searchSpecies(args.query as string, (args.limit as number) || 20),
                null,
                2
              ),
            },
          ],
        };

      case "get_ecology":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await fishbaseAPI.getEcology(args.species_name as string),
                null,
                2
              ),
            },
          ],
        };

      case "get_distribution":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await fishbaseAPI.getDistribution(args.species_name as string),
                null,
                2
              ),
            },
          ],
        };

      case "get_morphology":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await fishbaseAPI.getMorphology(args.species_name as string),
                null,
                2
              ),
            },
          ],
        };

      case "validate_species_name":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await fishbaseAPI.validateSpeciesName(args.species_name as string),
                null,
                2
              ),
            },
          ],
        };

      case "common_to_scientific":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await fishbaseAPI.commonToScientific(args.common_name as string),
                null,
                2
              ),
            },
          ],
        };

      case "list_tables":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await fishbaseAPI.listTables(),
                null,
                2
              ),
            },
          ],
        };

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Error executing tool ${name}: ${error}`
    );
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("FishBase MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});