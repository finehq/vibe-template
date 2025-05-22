import vibeBackend from "@fine-dev/vibe-backend";

declare global {
    interface Env {
        // ASSETS: Fetcher;
    }
}

const backend = vibeBackend()

export default {
    fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname.startsWith("/api/")) return backend.fetch(request, env)

        return new Response(null, { status: 404 });
    },
} satisfies ExportedHandler<Env>;
