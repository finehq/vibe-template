import vibeBackend from "@fine-dev/vibe-backend";
import { assistants } from "./assistants";
import { MyMCP } from "./mcp";

declare global {
    interface Env {
        // Define your environment variables here
    }
}

const backend = vibeBackend({ assistants, mcp: MyMCP })

export default {
    fetch(request, env, ctx) {
        const url = new URL(request.url);
        if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/.well-known/")) return backend.fetch(request, env, ctx)

        return new Response(null, { status: 404 })
    },
} satisfies ExportedHandler<Env>

export { MyMCP }
