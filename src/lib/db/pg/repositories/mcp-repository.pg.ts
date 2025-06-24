import type { MCPServerConfig } from "app-types/mcp";
import { pgDb as db } from "../db.pg";
import { McpServerSchema } from "../schema.pg";
import { eq } from "drizzle-orm";
import { generateUUID } from "lib/utils";
import type { MCPRepository } from "app-types/mcp";

export const pgMcpRepository: MCPRepository = {
  async insertServer(server) {
    const [result] = await db
      .insert(McpServerSchema)
      .values({
        id: generateUUID(),
        name: server.name,
        config: server.config,
        enabled: server.enabled ?? true,
      })
      .returning();

    return result.id;
  },

  async selectServerById(id) {
    const [result] = await db
      .select()
      .from(McpServerSchema)
      .where(eq(McpServerSchema.id, id));

    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      config: result.config as MCPServerConfig,
      enabled: result.enabled,
    };
  },

  async selectServerByName(name) {
    const [result] = await db
      .select()
      .from(McpServerSchema)
      .where(eq(McpServerSchema.name, name));

    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      config: result.config as MCPServerConfig,
      enabled: result.enabled,
    };
  },

  async selectAllServers() {
    const results = await db.select().from(McpServerSchema);

    return results.map((result) => ({
      id: result.id,
      name: result.name,
      config: result.config as MCPServerConfig,
      enabled: result.enabled,
    }));
  },

  async updateServer(id, data) {
    await db
      .update(McpServerSchema)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(McpServerSchema.id, id));
  },

  async deleteServer(id) {
    await db.delete(McpServerSchema).where(eq(McpServerSchema.id, id));
  },

  async existsServerWithName(name) {
    const [result] = await db
      .select({ id: McpServerSchema.id })
      .from(McpServerSchema)
      .where(eq(McpServerSchema.name, name));

    return !!result;
  },
};
