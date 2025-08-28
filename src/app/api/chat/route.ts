import { streamText, Message, experimental_createMCPClient, generateText } from 'ai';
import { ModelProvider } from '@/lib/ai/provider';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
// import { Client } from "@modelcontextprotocol/sdk/client/index.js";
// import { experimental_createMCPClient } from 'ai';
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export async function POST(req: Request) {
  const { messages } = await req.json();
  console.log("Received messages:", messages);

  const configPath = path.resolve(process.cwd(), 'mcp_servers_config.yaml');
  let mcpConfig: any = {};
  let client: any;
  let clientTools: Record<string, any> = {};
  try {
    const fileContent = fs.readFileSync(configPath, 'utf8');
    mcpConfig = yaml.load(fileContent) || {};
    if (mcpConfig.mcpServers && Object.keys(mcpConfig.mcpServers).length > 0) {
      for (const [server_name, server] of Object.entries(mcpConfig.mcpServers)) {
        const s = server as any;
        console.log('server name:', server_name);
        console.log('type:', s.type);
        console.log('command:', s.command);
        console.log('args:', s.args);
        if (s.type === 'stdio') {
          const stdioTransport = new StdioClientTransport({
            command: s.command,
            args: [...s.args],
            env: {
              ...process.env,
              ...(s.env || {}),
            },
          });
          client = await experimental_createMCPClient({
            transport: stdioTransport,
          });
          const toolSetOne = await client.tools();
          const tools = {
            ...toolSetOne,
          };
          clientTools = {
            ...clientTools,
            ...tools,
          }
        } else {
          console.error(`Unsupported server type: ${s.type}`);
          continue;
        }
      }
    } else {
      console.log('mcp_servers_config.yaml is empty or there are no mcpServers');
    }
  } catch (err) {
    console.error('Read mcp_servers_config.yaml error:', err);
  }
  console.log('clientTools:', clientTools);

  const result = streamText({
    model: ModelProvider['qwen2.5-7b-instruct'],
    // model: ModelProvider['gpt-3.5-turbo-1106'],
    messages,
    tools: clientTools,
    toolCallStreaming: true,
    system: `
[Available Tools]  
${Object.keys(clientTools).join(', ')}

[Decision Rules]  
1. Answer directly using existing knowledge if possible.  
2. Use tools only when:  
   - Real-time data is needed (e.g., stock prices, weather).  
   - Complex calculations or specialized knowledge are required.  
   - Information verification or primary sources are essential.  
3. Call 1 tool per step, matching names exactly as provided.  
4. Include only required parameters; avoid redundancy.  

[Result Handling]  
- Analyze tool outputs and synthesize insights with context.  
- If results are incomplete, explain and try an alternative approach.  
- Never return raw tool data; provide meaningful conclusions.  

[Communication]  
- Keep responses concise and relevant.  
- Clarify assumptions if uncertain.  
- Mention only tools relevant to the task.  
`
  });

  return result.toDataStreamResponse({
    getErrorMessage: error => {
      if (error instanceof Error) {
        return error.message;
      }
      console.error(error);
      return 'An unknown error occurred.';
    },
  });
}


