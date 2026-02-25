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

  it("clamps goal updates to metric bounds", () => {
    const { runtime, service } = createRuntime();

    service.initializeWellnessData();
    service.updateGoal("mood", 10);

    const afterMax = runtime.db.select().from(goals).where(eq(goals.metric, "mood")).get();
    expect(afterMax?.value).toBe(5);

    service.updateGoal("mood", 0);
    const afterMin = runtime.db.select().from(goals).where(eq(goals.metric, "mood")).get();
    expect(afterMin?.value).toBe(1);

    runtime.sqlite.close();
  });

  it("does not throw when incrementing repeatedly past max", () => {
    const { runtime, repository, service, defaults } = createRuntime();

    repository.clearAllData(defaults);

    expect(() => {
      for (let i = 0; i < 30; i++) {
        service.incrementMetric("2026-02-11", "water");
      }
    }).not.toThrow();

    expect(repository.getMetricValue("2026-02-11", "water")).toBe(20);

    runtime.sqlite.close();
  });

  it("does not throw when decrementing repeatedly below min", () => {
    const { runtime, repository, service, defaults } = createRuntime();

    repository.clearAllData(defaults);

    expect(() => {
      for (let i = 0; i < 10; i++) {
        service.decrementMetric("2026-02-11", "water");
      }
    }).not.toThrow();

    expect(repository.getMetricValue("2026-02-11", "water")).toBe(0);

    runtime.sqlite.close();
  });

  it("clamps direct metric updates to metric bounds", () => {
    const { runtime, repository, service, defaults } = createRuntime();

    repository.clearAllData(defaults);

    service.updateMetric("2026-02-11", "mood", 99);
    expect(repository.getMetricValue("2026-02-11", "mood")).toBe(5);

    service.updateMetric("2026-02-11", "mood", -10);
    expect(repository.getMetricValue("2026-02-11", "mood")).toBe(1);

    runtime.sqlite.close();
  });
});
