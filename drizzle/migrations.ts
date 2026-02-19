import generatedMigrations from "./migrations.js";

const migrations = generatedMigrations as {
  migrations: Record<string, string>;
};

export default migrations;
