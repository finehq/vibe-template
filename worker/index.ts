import withFineRoutes, { Hono, type HonoEnv } from "@fine-dev/vibe-backend";

declare global {
    interface Env {
        // ASSETS: Fetcher;
    }
}

const app = withFineRoutes(new Hono<HonoEnv>())
const apiRouter = new Hono().route("/api", app);

export default {
    fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname.startsWith("/api/")) return apiRouter.fetch(request, env)

        return new Response(null, { status: 404 });
    },
} satisfies ExportedHandler<Env>;
