import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "expo",
  dbCredentials: {
    url: "./pulse.db",
  },
  strict: true,
  verbose: true,
});
