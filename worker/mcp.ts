import { FineMCP } from "@fine-dev/vibe-backend"
import { z } from "zod"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

/**
 * An MCP agent for your application.
 * Make sure to always export this from `index.ts`, otherwise durable object bindings will not work.
 */
export class AppMCP extends FineMCP {
    server = new McpServer({
        name: "My MCP",
        version: "1.0.0"
    })

    async init() {
        // Tool examples
        this.server.tool(
            "add",
            "Add two numbers together",
            { a: z.number(), b: z.number() },
            async ({ a, b }) => ({
                content: [{ type: "text", text: String(a + b) }]
            })
        )

        // Example usage of the generic dbTools
        this.dbTools.select("user")
    }
}