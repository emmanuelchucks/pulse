import { react } from "@kasoa/oxlint-config/react";
import { defineConfig } from "oxlint";

export default defineConfig({
  ...react,
  ignorePatterns: ["drizzle/**"],
});
