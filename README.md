# Fine Vibe Template

This template allows you to create a full-stack app with Vite, complete with API endpoints, and deploy it to a cloudflare worker.

## Getting Started

Before deploying, make sure that you have a Cloudflare account and the Wrangler CLI installed (`npm i -g wrangler`).

The fastest and easist way to get your project up and running is to use Cloudflare's deployment wizard:

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/finehq/vibe-template)

#### Using the CLI

If you prefer to have more control over the process, you can use the following CLI command:

```bash
npm create @fine-dev/vibe
```

Before running the CLI, make sure that you have the following:

- A D1 database for your project
  - [D1 Database Setup Guide](https://developers.cloudflare.com/d1/get-started/)
- An R2 storage bucket set up
  - [R2 Storage Setup Guide](https://developers.cloudflare.com/r2/get-started/)

The CLI will guide you through the setup process:

1. Enter your project name
2. Provide your Cloudflare D1 database name and ID
3. Enter your R2 bucket name

Once complete, the CLI will:

- Clone the template repository into a new folder with your project name
- Configure `wrangler.jsonc` with your D1 database and R2 bucket settings
- Update the `package.json` with your project name

When you're ready to deploy your project, you will then need to run `npm run publish`. This command requires having the Wrangler CLI installed and configured.

## SDK and API Capabilities

This template comes pre-configured with a powerful stack that provides:

## Fine SDK

The Fine SDK, pre-installed with this template, is a powerful toolkit designed to simplify the process of authenticating users, performing database operations, and storing files. `@fine-dev/fine-js` provides a FineClient class, which, once instantiated, provides all of the SDK functionality.

Key components of the Fine SDK include:

- Database: `FineClient` extends `D1RestClient, providing methods for querying and mutating the database. The database is a SQLite database, and is queried using a REST API.
- Authentication: `fine.auth` is an instance of Better Auth's authentication client
- AI Client: `fine.ai` is an instance of the `FineAIClient`, which allows applications to conduct thread-based interactions with AI.
- Storage: `fine.storage` is an instance of the `FineStorageClient`, which allows you to upload, download and delete files bound to a specific entity in the database.

For more details about the Fine SDK, see [the fine-js GitHub repository](@fine-dev/fine-js).

### Configuring the Fine Client

The Fine client is initialized in `src/lib/fine.ts`. Make sure to update the worker URL that it receives to reflect the URL to your project's worker.

You may find your Workers subdomain in the Cloudflare dashboard:

1. Log in to your Cloudflare dashboard
2. Navigate to **Workers & Pages**
3. Look for **Subdomain** in the right-hand sidebar.

Your worker address will follow the pattern `WORKER_ADDRESS.WORKERS_SUBDOMAIN`, e.g. `my-project.john-t3u.workers.dev`.

### Database Types

The file `src/lib/db-types.ts` should contain types that reflect the database schema. It is recommended to keep it up to date with any changes you make to the schema to ensure that the SDK is type-safe:

- Table types should be contained within a record type `type Schema extends Record<string, Record<string, any>>`, where keys are table names, and values describe the columns and their types..
- Types should always match the casing of tables and columns in the database.
- Types should always reflect the type required for _insert_ - this means that columns that have defaults should be optional (e.g. `{ id?: number }`). This includes, for example, `AUTOINCREMENT` columns, columns that have a `DEFAULT` defined on them, or nullable columns (those not defined as `NOT NULL`).
- To reflect the schema consistently, always make sure that nullable columns of a given type T are properly defined as `T | null`.
- Use the `Required` utility type to convert your types to the right type for selected data, where necessary (the SDK already does this for you).

For example, the following migration:

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY,
  title TEXT NOT NULL,
  description TEXT
)
```

Should be reflected in your types like so:

```typescript
export type Schema = {
  tasks: { id?: number; title: string; description?: string | null };
};
```

### Protected Routes

If you have a route that requires authentication, wrap it with the `ProtectedRoute` component. This is a wrapper component that is already integrated with the Fine SDK, which will make sure that only authenticated users have access.

## Backend Framework (@fine-dev/vibe-backend)

This template comes complete with a backend powered by Hono, with routes available at `/api/`. The backend is already loaded with all of the functionality required by the Fine SDK, provided by the `@fine-dev/vibe-backend` package.

The backend is easily extensible to include your own business logic. API endpoints are defined in the `/worker` directory, with the entrypoint being `worker/index.ts`.

### Adding Custom API Endpoints

To add your own custom API endpoints, modify the Hono app in `worker/index.ts`:

```typescript
// Add this before creating the apiRouter
app.get("/custom-endpoint", (c) => {
  return c.json({ message: "Hello from custom endpoint!" });
});

// Add authenticated endpoints
app.use("/secure-endpoint", async (c, next) => {
  // This middleware checks if the user is authenticated
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
});

app.get("/secure-endpoint", (c) => {
  const user = c.get("user");
  return c.json({ message: `Hello, ${user.name}!` });
});

const apiRouter = new Hono().route("/api", app);
```

### Migrations

If you need to make changes to the database schema, follow [Cloudflare's migration guide](https://developers.cloudflare.com/d1/reference/migrations/). Make sure that the SQL you write is compatible with the _SQLite dialect_, as Fine uses Cloudflare D1 under the hood.
