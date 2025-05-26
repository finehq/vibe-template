import vibeBackend from "@fine-dev/vibe-backend";
import { assistants } from "./assistants";

declare global {
    interface Env {
        // ASSETS: Fetcher;
    }
}

const backend = vibeBackend({ assistants })

export default {
    fetch(request, env, ctx) {
        const url = new URL(request.url);
        if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/.well-known/")) return backend.fetch(request, env, ctx)

        return new Response(null, { status: 404 });
    },
} satisfies ExportedHandler<Env>;
