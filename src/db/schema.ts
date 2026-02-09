import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const dailyEntries = sqliteTable("daily_entries", {
  date: text("date").primaryKey(),
  water: real("water").notNull().default(0),
  mood: integer("mood").notNull().default(0),
  sleep: real("sleep").notNull().default(0),
  exercise: real("exercise").notNull().default(0),
  updatedAt: integer("updated_at")
    .notNull()
    .$defaultFn(() => Date.now()),
});

export const goals = sqliteTable("goals", {
  metric: text("metric").primaryKey(),
  value: real("value").notNull(),
  updatedAt: integer("updated_at")
    .notNull()
    .$defaultFn(() => Date.now()),
});
