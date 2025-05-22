import { FineClient } from "@fine-dev/fine-js";
import type { Schema } from "./db-types";

export const fine = new FineClient<Schema>("/api");