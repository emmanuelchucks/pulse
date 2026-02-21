import { sqliteTable, uniqueIndex } from "drizzle-orm/sqlite-core";

const createId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const dailyEntries = sqliteTable(
  "daily_entries",
  (t) => ({
    id: t.text("id").primaryKey().$defaultFn(createId),
    date: t.text("date").notNull(),
    water: t.real("water").notNull().default(0),
    mood: t.integer("mood").notNull().default(0),
    sleep: t.real("sleep").notNull().default(0),
    exercise: t.real("exercise").notNull().default(0),
    createdAt: t
      .integer("created_at")
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: t
      .integer("updated_at")
      .notNull()
      .$defaultFn(() => Date.now()),
  }),
  (t) => [uniqueIndex("daily_entries_date_unique").on(t.date)],
);

export const goals = sqliteTable(
  "goals",
  (t) => ({
    id: t.text("id").primaryKey().$defaultFn(createId),
    metric: t.text("metric").notNull(),
    value: t.real("value").notNull(),
    createdAt: t
      .integer("created_at")
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: t
      .integer("updated_at")
      .notNull()
      .$defaultFn(() => Date.now()),
  }),
  (t) => [uniqueIndex("goals_metric_unique").on(t.metric)],
);
