import 'dotenv/config';

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from 'fs';
import dotenv from 'dotenv';

// Create MCP server
const server = new McpServer({
  name: "spotify-profile-server",
  version: "1.0.0"
});

// Register profile tool
server.registerTool(
  "getSpotifyProfile",
  {
    title: "Get Spotify User Profile",
    description: "Get all Spotify user profile information automatically",
    // inputSchema: { a: z.number(), b: z.number() }
    // inputSchema: { a: z.number() }
    inputSchema: { dummy: z.string() } // NOTE: dummy input schema, seems can't be empty because some bugs in vercel MCP lib.
  },
  async () => {
    dotenv.config({ path: '.env.local', override: true });
    // Get access token from env
    const accessToken = process.env.SPOTIFY_ACCESS_TOKEN;
    // console.log('[MCP] accessToken:', accessToken);
    if (!accessToken) {
      // console.log('[MCP] No access token found in env');
      return {
        content: [
          { type: "text", text: "SPOTIFY_ACCESS_TOKEN env variable is missing." }
        ]
      };
    }
    // Fetch Spotify profile
    let response;
    try {
      response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      // console.log('[MCP] Spotify API response status:', response.status);
    } catch (err) {
      // console.log('[MCP] Fetch error:', err);
      return {
        result: null,
        content: [
          { type: "text", text: `Fetch error: ${err?.message || err}` }
        ]
      };
    }
    if (!response.ok) {
      const error = await response.json();
      // console.log('[MCP] Spotify API error:', error);
      return {
        result: error,
        content: [
          { type: "text", text: `Failed to fetch Spotify profile: ${JSON.stringify(error)}` }
        ]
      };
    }
    const data = await response.json();
    // console.log('[MCP] Spotify profile data:', data);
    return {
      result: data,
      content: [
        { type: "json", json: data }
      ]
    };
  }
);

// Start MCP server
const transport = new StdioServerTransport();
await server.connect(transport);

// fs.appendFileSync('mcp.log', '[MCP] process.env: ' + JSON.stringify(process.env) + '\\n');
