#!/usr/bin/env node

// Example of how to test the MCP server manually
// This simulates how n8n or other clients would interact with the MCP server

import { spawn } from 'child_process';

async function testMCPServer() {
  console.log('Testing FishBase MCP Server...\n');

  const tests = [
    {
      name: 'List Tables',
      tool: 'list_tables',
      args: {},
    },
    {
      name: 'Get Species Info - Brown Trout',
      tool: 'get_species',
      args: { species_name: 'Salmo trutta' },
    },
    {
      name: 'Search Species - Trout',
      tool: 'search_species',
      args: { query: 'trout', limit: 5 },
    },
    {
      name: 'Get Ecology - Brown Trout',
      tool: 'get_ecology',
      args: { species_name: 'Salmo trutta' },
    },
    {
      name: 'Common to Scientific - Brown trout',
      tool: 'common_to_scientific',
      args: { common_name: 'Brown trout' },
    },
    {
      name: 'Validate Species Name',
      tool: 'validate_species_name',
      args: { species_name: 'Salmo trutta' },
    },
  ];

  for (const test of tests) {
    console.log(`=== ${test.name} ===`);
    
    try {
      const result = await callMCPTool(test.tool, test.args);
      console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error:', error.message);
    }
    
    console.log(''); // Empty line for readability
  }
}

function callMCPTool(toolName, args) {
  return new Promise((resolve, reject) => {
    const mcpProcess = spawn('node', ['./dist/index.js'], {
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
        // Parse the JSON-RPC response
        const lines = stdout.trim().split('\n');
        const responseLine = lines.find(line => line.includes('"result"') || line.includes('"error"'));
        
        if (responseLine) {
          const response = JSON.parse(responseLine);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.result);
          }
        } else {
          resolve({ message: 'No structured response found', raw: stdout });
        }
      } catch (parseError) {
        reject(new Error(`Failed to parse MCP response: ${parseError.message}`));
      }
    });

    // Send JSON-RPC request
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
}

// Run the tests
testMCPServer().catch(console.error);