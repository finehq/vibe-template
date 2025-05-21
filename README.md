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

### Configuring the Fine Client

The Fine client is initialized in `src/lib/fine.ts`. Make sure to update the worker URL that it receives to reflect the URL to your project's worker.

You may find your Workers subdomain in the Cloudflare dashboard:

1. Log in to your Cloudflare dashboard
2. Navigate to **Workers & Pages**
3. Look for **Subdomain** in the right-hand sidebar.

Your worker address will follow the pattern `WORKER_ADDRESS.WORKERS_SUBDOMAIN`, e.g. `my-project.john-t3u.workers.dev`.

### Authentication

The Fine SDK is used in this template to authenticate users. You will rarely need to use the authentication client directly - the template already implements everything that you will need for authentication to work.

If you have a route that requires authentication, wrap it with the `ProtectedRoute` component. This will make sure that only authenticated users can access it.

#### Getting the session

To get the user session, you may use the `fine.auth.useSession` React hook. `useSession` can ONLY be called inside of the body of a function component, just like any other react hook, and returns the following object:

```typescript
ReturnType<FineClient["auth"]["useSession"]> = {
  data:
    {
      user: { id: string, name: string, email: string, createdAt: Date, updatedAt: Date, image: string | null },
      session: { id: string, createdAt: Date, updatedAt: Date, userId: string, expiresAt: Date, token: string },
    } | null,
  isPending: boolean,
};
```

`isPending` indicates whether the user has been loaded. `isPending === false && data === null` indicates that the user is not logged in.

### Database and Persistence

If your project requires a database, the Fine SDK has you covered. Using the database does not necessarily require authentication, however note that anonymous users only have read permissions. This means that if you implement data mutations, you _will_ need to make sure that only authenticated users can access them.

Example usage of the Fine SDK:

```
// Select tasks in a workspace with the given ids
const tasks = await fine.table("tasks").select("id, description").eq("workspace", workspaceId).like("title", "Cook%")
// Insert new tasks and fetch them
const newTasks = await fine.table("tasks").insert(newTasks).select()
// Update an existing task
const updatedTasks, error = await fine.table("tasks").update(updates).eq("id", taskId).select()
// Delete a tasks
await fine.table("tasks").delete().eq("id", taskId)
```

Data pulled from the database will have JSON rows as strings, as this is how they are stored in the database. You will need to parse these before using them to actually access the JSON structure.

Checking the user's authentication status before doing database actions is not required - the SDK will take care of this for you.

#### Migrations

If you need to make changes to the database schema, follow [Cloudflare's migration guide](https://developers.cloudflare.com/d1/reference/migrations/). Make sure that the SQL you write is compatible with the _SQLite dialect_.

#### Database Types

The file `src/lib/db-types.ts` should contain types that reflect the database schema. It is recommended to keep it up to date with any changes you make to the schema to ensure that the SDK is type-safe:

- Table types should be contained within a record type `type Schema extends Record<string, Record<string, any>>`, where keys are table names, and values describe the columns and their types..
- Types should always match the casing of tables and columns in the database.
- Types should always reflect the type required for _insert_ - this means that columns that have defaults should be optional (e.g. `{ id?: number }`). This includes, for example, `AUTOINCREMENT` columns, columns that have a `DEFAULT` defined on them, or nullable columns (those not defined as `NOT NULL`).
- To reflect the schema consistently, always make sure that nullable columns of a given type T are properly defined as `T | null`.
- Use the `Required` utility type to convert your types to the right type for selected data, where necessary (the SDK already does this for you).

For example, the following migration:

```
CREATE TABLE tasks (
  id SERIAL PRIMARY,
  title TEXT NOT NULL,
  description TEXT
)
```

Will be reflected in `db-types.ts` like so:

```
export type Schema = {
  tasks: { id?: number, title: string, description?: string | null }
}
```

#### D1RestClient Interface

```
type Fetch = typeof fetch;
export type GenericSchema = Record<string, Record<string, any>>;
export default class D1RestClient<Tables extends GenericSchema = GenericSchema> {
    private baseUrl;
    private headers;
    fetch: Fetch;
    constructor({ baseUrl, headers, fetch: customFetch }: {
        baseUrl: string;
        headers?: Record<string, string>;
        fetch?: Fetch;
    });
    table<TableName extends keyof Tables>(tableName: TableName): D1QueryBuilder<Tables, TableName>;
}
declare class D1QueryBuilder<Tables extends Record<string, any>, TableName extends keyof Tables> {
    url: URL;
    headers: Record<string, string>;
    fetch: Fetch;
    constructor(url: URL, { headers, fetch }: {
        headers?: Record<string, string>;
        fetch: Fetch;
    });
    select(columns?: string): Omit<D1FilterBuilder<Tables[TableName][]>, "select">;
    insert(values: Tables[TableName] | Tables[TableName][]): D1FilterBuilder<Tables[TableName][]>;
    update(values: Partial<Tables[TableName]>): D1FilterBuilder<Tables[TableName][]>;
    delete(): D1FilterBuilder<Tables[TableName][]>;
}
declare class D1FilterBuilder<ResultType> {
    url: URL;
    headers: Record<string, string>;
    fetch: Fetch;
    method: "GET" | "POST" | "PATCH" | "DELETE";
    body?: any;
    constructor({ url, headers, fetch, method, body }: {
        url: URL;
        headers: Record<string, string>;
        fetch: Fetch;
        method: "GET" | "POST" | "PATCH" | "DELETE";
        body?: any;
    });
    eq(column: string, value: any): this;
    neq(column: string, value: any): this;
    gt(column: string, value: any): this;
    lt(column: string, value: any): this;
    like(column: string, pattern: string): this;
    in(column: string, values: any[]): this;
    order(column: string, { ascending }?: {
        ascending?: boolean | undefined;
    }): this;
    limit(count: number): this;
    offset(count: number): this;
    select(columns?: string): this;
    then(resolve: (value: ResultType | null) => void, reject?: (reason?: any) => void): Promise<void>;
}
```

### File Storage

Use Fine's storage client (`fine.storage`) whenever your application needs file storage capabilities, e.g. for user profile pictures, E-commerce product images, document management, etc.

The storage client follows an entity-based approach to file storage:

- Each file is associated with a specific entity (table row) in your database.
- Files are referenced by an `EntityReference` which consists of:
  - `table`: The database table name
  - `id`: The unique ID of the record
  - `field`: The field/column name in that table that stores the filename
- When a file is uploaded, the file name is updated automatically on the relevant entity to maintain referential integrity. Do not touch the related column, as it might break the application behavior.

### Usage

```javascript
// An `EntityReference` is used to indicate which row and column in the database the file is connected to
const entityRef = { table: "recipes", id: "recipe-123", field: "imageName" }

// Upload a file. This will also add the file name to the relevant column in your data model.
const fileInput = document.getElementById("fileInput").files[0]
const metadata = { alt: "Chocolate cake recipe image", createdBy: "user-456" } // Metadata is optional
await fine.storage.upload(entityRef, file, metadata, true) // Set isPublic (the 4th parameter) to `true` to make the file publicly accessible.

// Get a URL for a file using the entity reference and filename
const imageUrl = fine.storage.getDownloadUrl(entityRef, recipe.imageName)
// You can use this URL in an image tag - it will work if the user has permission to fetch the row, or if the image is public
<img src={imageUrl} />

// Trigger a file download
await fine.storage.download(entityRef, recipe.imageName)

// Delete a file
await fine.storage.delete(entityRef, recipe.imageName)
```

### AI Assistants

Some applications require the ability to interact with AI. You may use `fine.ai` (an instance of `FineAIClient`) for this purpose, which provides an abstraction over AI in the form of assistants. This allows you to define different system prompts for different purposes. To start a run, you will need to provide the ID of the assistant that you want to use.

#### Creating an assistant

If you need to create a new assistant, do so by adding a row to the `_ai_assistants` table. Your assistant should include at least the following:

- `id` - A slug-like ID that will be used by the SDK to determine which assistant to call.
- `name` - The assistants's name.
- `systemPrompt` - A system prompt that provides the agent with instructions on what it should and should not do.

#### Using AI in your code

`fine.ai`, an instance of the `FineAIClient`, allows you to interact with the Fine AI backend with minimal boilerplate. You may use this client, if necessary, to fulfill the requirements. Users need to be authenticated for the AI SDK to work.

**Sending or streaming a message is the primary way to create threads and messages**. You will rarely need to call the methods that create threads or messages directly.

##### 💬 Sending a Message (Streaming)

This is the **main way** to interact with the system. When you stream a message, both the **message** and its **thread** (if needed) are created automatically.

```ts
await client.message(assistantId, "Hello, world!").stream((event) => {
  switch (event.type) {
    case "runStarted":
      console.log(`Run started:`, event);
      break;
    case "contentChunk":
      process.stdout.write(event.chunk);
      break;
    case "runCompleted":
      console.log(`\nResponse complete:`, event.fullResponse);
      break;
    case "runError":
      console.error(`Stream error:`, event.error);
      break;
  }
});
```

You can also chain `.setMetadata()` to attach arbitrary metadata:

```ts
await client
  .message(assistantId, "Hey there!")
  .setMetadata({ source: "homepage" })
  .stream((event) => {
    if (event.type === "contentChunk") process.stdout.write(event.chunk);
  });
```

If you don't need streaming, use `.send()` instead:

```ts
const result = await client.message(assistantId, "Quick reply").setMetadata({ test: true }).send();

if ("status" in result && result.status === "completed") {
  console.log("Response:", result.content);
} else {
  console.error("Failed:", result);
}
```

##### Image Uploads

Fine's AI SDK makes it simple to attach images to your messages.

1. Obtain a list of `File` objects (or a single `File`). This is usually done with an input of type `file`, or with a drag event's `dataTransfer` property.
2. Chain an `.attach()` call to your message, passing it the files you obtained in step 1. The SDK will upload the files for you, and pass them on to the assistant - no need to do anything else!

```ts
await client.message(assistantId, "What is this dish?").attach(files).send();
```

##### 🧵 Working with Threads

You can fetch a user's threads easily with the client:

```ts
const threads = await client.threads;

for (const thread of threads) {
  console.log("Thread ID:", thread.id);
}
```

This will only return threads belonging to the logged-in user, which is useful for chat-like interfaces.

Reference an existing thread like so:

```ts
const thread = client.thread("thread_123");
```

Stream a message into an existing thread:

```ts
await thread.message(assistantId, "Continue the story...").stream((event) => {
  if (event.type === "contentChunk") process.stdout.write(event.chunk);
});
```

##### Thread utilities

- Fetch thread metadata:

```ts
const data = await thread.data;
```

- Fetch all messages in a thread:

```ts
const messages = await thread.messages;
messages.forEach((msg) => {
  console.log(`[${msg.role}]`, msg.content);
});
```

- Update thread metadata:

```ts
await thread.update({ topic: "Customer Support" });
```

- Delete a thread:

```ts
await thread.delete();
```

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
