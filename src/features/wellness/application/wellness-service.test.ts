import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { goals } from "@/db/schema";
import { createWellnessService } from "@/features/wellness/application/wellness-service";
import { createDefaultGoals } from "@/features/wellness/domain/default-goals";
import { createDrizzleWellnessRepository } from "@/features/wellness/infra/wellness-repository";
import { createSqliteTestDb } from "@/test/sqlite-test-db";

function createRuntime() {
  const runtime = createSqliteTestDb();
  const repository = createDrizzleWellnessRepository(runtime.db);
  const service = createWellnessService(repository);
  const defaults = createDefaultGoals();

  return { runtime, repository, service, defaults };
}

describe("wellness service", () => {
  it("seeds goals only once during initialization", () => {
    const { runtime, service } = createRuntime();

    service.initializeWellnessData();
    service.initializeWellnessData();

    const goalRows = runtime.db.select().from(goals).all();
    expect(goalRows).toHaveLength(4);

    runtime.sqlite.close();
  });

  it("increments and decrements using metric step values", () => {
    const { runtime, repository, service, defaults } = createRuntime();

    repository.clearAllData(defaults);

    service.incrementMetric("2026-02-11", "water");
    service.incrementMetric("2026-02-11", "water");
    service.decrementMetric("2026-02-11", "water");

    expect(repository.getMetricValue("2026-02-11", "water")).toBe(1);

    runtime.sqlite.close();
  });

  it("rejects invalid goal updates through metric validation", () => {
    const { runtime, service } = createRuntime();

    service.initializeWellnessData();

    const before = runtime.db.select().from(goals).where(eq(goals.metric, "mood")).get();

    expect(() => service.updateGoal("mood", 10)).toThrow();

    const after = runtime.db.select().from(goals).where(eq(goals.metric, "mood")).get();
    expect(after?.value).toBe(before?.value);
    expect(after?.value).toBe(5);

    runtime.sqlite.close();
  });
});
