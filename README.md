# MCP FishBase Server

A Model Context Protocol (MCP) server that provides access to FishBase marine biology data, with n8n integration.

<a href="https://glama.ai/mcp/servers/@lundgrenalex/mcp-fishbase">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@lundgrenalex/mcp-fishbase/badge" alt="FishBase Server MCP server" />
</a>

## Features

- Access to FishBase species data
- Ecological information
- Distribution/occurrence data
- Morphological data
- Species name validation
- Common name to scientific name conversion

## Installation

### MCP Server

```bash
cd mcp_fishbase
npm install
npm run build
npm run start
```

### n8n Integration

```bash
cd n8n-integration
npm install
npm run build
```

Then install the node package in your n8n instance:

```bash
npm install /path/to/n8n-integration
```

## Usage

### MCP Tools Available

- `get_species`: Get detailed species information
- `search_species`: Search for species by name
- `get_ecology`: Get ecological data for a species
- `get_distribution`: Get distribution/occurrence data
- `get_morphology`: Get morphological data
- `validate_species_name`: Validate and suggest corrections for species names
- `common_to_scientific`: Convert common names to scientific names
- `list_tables`: List all available FishBase tables

### Example Usage in n8n

1. Add the FishBase node to your workflow
2. Configure the operation (e.g., "Get Species Info")
3. Provide the species name (e.g., "Salmo trutta")
4. Connect to downstream nodes for data processing

### Example Species Data

```json
{
  "SpecCode": 1,
  "Genus": "Salmo",
  "Species": "trutta",
  "FBname": "Brown trout",
  "Length": 100,
  "CommonLength": 30,
  "Weight": 17000
}
```

## Development

The MCP server uses mock data for development. In production, you would integrate with the actual FishBase HuggingFace datasets using a proper Parquet parser.

## License

MIT