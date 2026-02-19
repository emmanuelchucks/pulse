import { describe, expect, it, vi } from "vitest";

import type { WellnessRepository } from "@/features/wellness/infra/wellness-repository";

import { createWellnessService } from "@/features/wellness/application/wellness-service";

function createRepositoryMock() {
  const values = new Map<string, number>();

  const seedGoals = vi.fn();
  const upsertMetric = vi.fn((date: string, metric: string, value: number) => {
    values.set(`${date}:${metric}`, value);
  });
  const getMetricValue = vi.fn(
    (date: string, metric: string) => values.get(`${date}:${metric}`) ?? 0,
  );
  const upsertGoal = vi.fn();
  const resetDay = vi.fn();
  const clearAllData = vi.fn();

  const repository: WellnessRepository = {
    seedGoals,
    upsertMetric,
    getMetricValue,
    upsertGoal,
    resetDay,
    clearAllData,
  };

  return {
    repository,
    seedGoals,
    upsertMetric,
    upsertGoal,
  };
}

describe("wellness service", () => {
  it("seeds goals only once during initialization", () => {
    const { repository, seedGoals } = createRepositoryMock();
    const service = createWellnessService(repository);

    service.initializeWellnessData();
    service.initializeWellnessData();

    expect(seedGoals).toHaveBeenCalledTimes(1);
  });

  it("increments and decrements using metric step values", () => {
    const { repository, upsertMetric } = createRepositoryMock();
    const service = createWellnessService(repository);

    service.incrementMetric("2026-02-11", "water");
    service.incrementMetric("2026-02-11", "water");
    service.decrementMetric("2026-02-11", "water");

    expect(upsertMetric).toHaveBeenLastCalledWith("2026-02-11", "water", 1);
  });

  it("rejects invalid goal updates through metric validation", () => {
    const { repository, upsertGoal } = createRepositoryMock();
    const service = createWellnessService(repository);

    expect(() => service.updateGoal("mood", 10)).toThrow();
    expect(upsertGoal).not.toHaveBeenCalled();
  });
});
