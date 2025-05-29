# Fine Vibe Template

This template allows you to create a full-stack app with Vite and React, complete with API endpoints, and deploy it to a Cloudflare worker.

The template is jam-packed with the following awesome features:

- 🔐 **Authentication** - Seamless user management with secure login/signup flows and session handling
- 💾 **Database** - Simple yet powerful database operations with type-safe queries and mutations
- 📁 **Storage** - Entity-based file storage for images, documents, and more with automatic database references
- 🤖 **AI Assistants** - Create context-aware AI threads with streaming responses and image upload capabilities
- 🎙️ **Audio Transcription** - Convert audio recordings or uploaded files to text with a simple API
- ⚡ **Serverless Ready** - Built to run perfectly on Cloudflare Workers with D1 database and R2 storage
- 🔄 **Full-Stack Integration** - Seamlessly connect your frontend to backend services with minimal code
- 🛠️ **Extensible Backend** - Add custom API endpoints under `/api/` with full TypeScript support and access to all Fine features

All of these are powered by the powerful Fine SDK (`@fine-dev/fine-js`), coupled with Fine's Vibe Backend (`@fine-dev/vibe-backend`)—a wrapper over Hono.

## Getting Started

The fastest and easist way to get your project up and running is to use Cloudflare's deployment wizard:

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/finehq/vibe-template)

### Manual Setup

If you prefer to setup your project manually, you will need to:

1. Clone the template with `git clone https://github.com/finehq/vibe-template my-project`
2. Change the `name` field in both `package.json` and `wrangler.jsonc` to your project's name
3. Create a D1 database for your project and update its name and id in `wrangler.jsonc` (see [D1 Database Setup Guide](https://developers.cloudflare.com/d1/get-started/))
4. Run `npm run db:preset-migrations` to ensure that your D1 Database has all the required tables
5. Have an R2 storage bucket set up and update its name in `wrangler.jsonc` (see [R2 Storage Setup Guide](https://developers.cloudflare.com/r2/get-started/))
6. Publish your worker to Cloudflare with `npm run publish` (requires Cloudflare's Wrangler CLI)

## Fine SDK 📦 `@fine-dev/fine-js`

The Fine SDK, pre-installed with this template, is a powerful toolkit designed to simplify the process of authenticating users, performing database operations, and storing files. An instance of the SDK is exported and ready to use from `@/lib/fine`.

Key components of the Fine SDK include:

- 🗄️ **Database**: `FineClient` extends `D1RestClient`, providing powerful methods for querying and mutating your SQLite database through a simple REST API
- 🔑 **Authentication**: Every `FineClient` instance includes Better Auth for seamless user management, available via `.auth`
- 🤖 **AI Client**: Access AI capabilities through `.ai` - an instance of `FineAIClient` that enables thread-based interactions with AI assistants
- 📁 **Storage**: Use `.storage` to easily manage files with `FineStorageClient` - upload, download and delete files that are automatically linked to your database entities

For more details about the Fine SDK, see [fine-js on GitHub](https://github.com/finehq/fine-js).

### Database Types

The file `src/lib/db-types.ts` should contain types that reflect the database schema. It is recommended to keep it up to date with any changes you make to the schema to ensure that the SDK is type-safe:

- Table types should be contained within a record type `type Schema extends Record<string, Record<string, any>>`, where keys are table names, and values describe the columns and their types.
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

If you have a route that requires authentication, wrap it with the `ProtectedRoute` component. This is a wrapper component that is already integrated with the Fine SDK, making sure that only authenticated users have access:

```tsx
<Route path='/tasks' element={<ProtectedRoute Component={TaskList} />} />
```

## Vibe Backend 📦 `@fine-dev/vibe-backend`

This template comes complete with a backend powered by Hono, with routes available at `/api/`. The backend is already loaded with all of the functionality required by the Fine SDK, provided by the `@fine-dev/vibe-backend` package, and is easily extensible.

### Adding Custom API Endpoints

To add your own custom API endpoints, pass an `addCustomRoutes` function inside the `vibeBackend` options in `workers/index.ts`:

```typescript
// Add this before creating the apiRouter
const backend = vibeBackend({
  addCustomRoutes(apiRouter) {
    apiRouter.get("/custom-endpoint", (c) => {
      return c.json({ message: "Hello from custom endpoint!" });
    });
  },
});
```

You may use the `authenticatedOnly` or `adminOnly` middleware to restrict access to your routes:

```typescript
import { authenticatedOnly } from "@fine-dev/vibe-backend"
...
// Place this before routes that should be authenticated, and after routes that should be open
apiRouter.use(authenticatedOnly)
```

### Auth Secret

For security reasons, you should set your own `AUTH_SECRET` environment variable in production. You can generate a secret with the following command:

```
openssl rand -base64 32
```

Then, run the following to deploy it to cloudflare:

```
npx wrangler secret put AUTH_SECRET
```

### Using Assistants

If using the assistants API provided by the backend, you will need to set the `OPENAI_API_KEY` environment variable:

```
npx wrangler secret put OPENAI_API_KEY
```

For local development, place this variable inside of a `.dev.vars` file - the syntax is identical to a `.env` file.

Read more about secrets in the [Cloudflare Docs](https://developers.cloudflare.com/workers/configuration/secrets/).

### Auth context

The vibe backend takes care of adding authentication data to the context on all requests, available at `c.get("auth")`:

```typescript
{
    // `user.bypass` will be set to true either when the user is an admin, or when the `BYPASS_AUTH` environment variable is set to `true`.
    user: User | { bypass: true; id: string } | null
    session?: Session | null
    role: "anon" | "user" | "admin"
    // A BetterAuth client instance
    client: ReturnType<typeof createAuth>
}
```

### Migrations

If you need to make changes to the database schema, follow [Cloudflare's migration guide](https://developers.cloudflare.com/d1/reference/migrations/). Make sure that the SQL you write is compatible with the _SQLite dialect_, as Fine uses Cloudflare D1 under the hood.
