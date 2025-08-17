import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

export class FishBase implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'FishBase',
    name: 'fishBase',
    icon: 'file:fishbase.svg',
    group: ['data'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Access FishBase marine biology data',
    defaults: {
      name: 'FishBase',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Species',
            value: 'species',
          },
          {
            name: 'Ecology',
            value: 'ecology',
          },
          {
            name: 'Distribution',
            value: 'distribution',
          },
          {
            name: 'Morphology',
            value: 'morphology',
          },
          {
            name: 'Common Names',
            value: 'commonNames',
          },
        ],
        default: 'species',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['species'],
          },
        },
        options: [
          {
            name: 'Get Species Info',
            value: 'getSpecies',
            action: 'Get species information',
          },
          {
            name: 'Search Species',
            value: 'searchSpecies',
            action: 'Search for species',
          },
          {
            name: 'Validate Name',
            value: 'validateName',
            action: 'Validate species name',
          },
        ],
        default: 'getSpecies',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['ecology'],
          },
        },
        options: [
          {
            name: 'Get Ecology Data',
            value: 'getEcology',
            action: 'Get ecological information',
          },
        ],
        default: 'getEcology',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['distribution'],
          },
        },
        options: [
          {
            name: 'Get Distribution',
            value: 'getDistribution',
            action: 'Get distribution data',
          },
        ],
        default: 'getDistribution',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['morphology'],
          },
        },
        options: [
          {
            name: 'Get Morphology',
            value: 'getMorphology',
            action: 'Get morphological data',
          },
        ],
        default: 'getMorphology',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['commonNames'],
          },
        },
        options: [
          {
            name: 'Common to Scientific',
            value: 'commonToScientific',
            action: 'Convert common name to scientific',
          },
        ],
        default: 'commonToScientific',
      },
      {
        displayName: 'Species Name',
        name: 'speciesName',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['getSpecies', 'getEcology', 'getDistribution', 'getMorphology', 'validateName'],
          },
        },
        default: '',
        placeholder: 'e.g., Salmo trutta',
        description: 'Scientific name of the species (Genus species)',
        required: true,
      },
      {
        displayName: 'Search Query',
        name: 'searchQuery',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['searchSpecies'],
          },
        },
        default: '',
        placeholder: 'e.g., trout or Salmo',
        description: 'Search term for species (scientific or common name)',
        required: true,
      },
      {
        displayName: 'Common Name',
        name: 'commonName',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['commonToScientific'],
          },
        },
        default: '',
        placeholder: 'e.g., Brown trout',
        description: 'Common name of the fish',
        required: true,
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        displayOptions: {
          show: {
            operation: ['searchSpecies'],
          },
        },
        default: 20,
        description: 'Maximum number of results to return',
      },
      {
        displayName: 'Fields',
        name: 'fields',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['getSpecies'],
          },
        },
        default: '',
        placeholder: 'Genus,Species,FBname,Length',
        description: 'Comma-separated list of fields to return (optional)',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const resource = this.getNodeParameter('resource', i) as string;
        const operation = this.getNodeParameter('operation', i) as string;

        let responseData: any;

        if (resource === 'species') {
          if (operation === 'getSpecies') {
            const speciesName = this.getNodeParameter('speciesName', i) as string;
            const fieldsParam = this.getNodeParameter('fields', i) as string;
            const fields = fieldsParam ? fieldsParam.split(',').map(f => f.trim()) : undefined;
            
            responseData = await this.callMCPTool('get_species', {
              species_name: speciesName,
              fields,
            });
          } else if (operation === 'searchSpecies') {
            const searchQuery = this.getNodeParameter('searchQuery', i) as string;
            const limit = this.getNodeParameter('limit', i) as number;
            
            responseData = await this.callMCPTool('search_species', {
              query: searchQuery,
              limit,
            });
          } else if (operation === 'validateName') {
            const speciesName = this.getNodeParameter('speciesName', i) as string;
            
            responseData = await this.callMCPTool('validate_species_name', {
              species_name: speciesName,
            });
          }
        } else if (resource === 'ecology') {
          const speciesName = this.getNodeParameter('speciesName', i) as string;
          responseData = await this.callMCPTool('get_ecology', {
            species_name: speciesName,
          });
        } else if (resource === 'distribution') {
          const speciesName = this.getNodeParameter('speciesName', i) as string;
          responseData = await this.callMCPTool('get_distribution', {
            species_name: speciesName,
          });
        } else if (resource === 'morphology') {
          const speciesName = this.getNodeParameter('speciesName', i) as string;
          responseData = await this.callMCPTool('get_morphology', {
            species_name: speciesName,
          });
        } else if (resource === 'commonNames') {
          const commonName = this.getNodeParameter('commonName', i) as string;
          responseData = await this.callMCPTool('common_to_scientific', {
            common_name: commonName,
          });
        }

        const executionData = this.helpers.constructExecutionMetaData(
          [{ json: responseData }],
          { itemData: { item: i } }
        );

        returnData.push(...executionData);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
            },
            pairedItem: {
              item: i,
            },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }

  private async callMCPTool(toolName: string, args: any): Promise<any> {
    try {
      const { spawn } = await import('child_process');
      
      return new Promise((resolve, reject) => {
        const mcpProcess = spawn('node', ['/Users/lundgren/Documents/repo/fishing/mcp_fishbase/dist/index.js'], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';

        mcpProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        mcpProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        mcpProcess.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`MCP process exited with code ${code}: ${stderr}`));
            return;
          }

          try {
            const response = JSON.parse(stdout);
            resolve(response);
          } catch (parseError) {
            reject(new Error(`Failed to parse MCP response: ${parseError}`));
          }
        });

        const request = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: args,
          },
        };

        mcpProcess.stdin.write(JSON.stringify(request) + '\n');
        mcpProcess.stdin.end();
      });
    } catch (error) {
      throw new NodeOperationError(
        this.getNode(),
        `Failed to call MCP tool ${toolName}: ${error.message}`
      );
    }
  }
}