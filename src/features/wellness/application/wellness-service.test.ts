import { describe, expect, it, vi } from "vitest";

import type { WellnessRepository } from "@/features/wellness/infra/wellness-repository";

import { createWellnessService } from "@/features/wellness/application/wellness-service";

function createRepositoryMock(): WellnessRepository {
  const values = new Map<string, number>();

  return {
    seedGoals: vi.fn(),
    upsertMetric: vi.fn((date, metric, value) => {
      values.set(`${date}:${metric}`, value);
    }),
    getMetricValue: vi.fn((date, metric) => values.get(`${date}:${metric}`) ?? 0),
    upsertGoal: vi.fn(),
    resetDay: vi.fn(),
    clearAllData: vi.fn(),
  };
}

describe("wellness service", () => {
  it("seeds goals only once during initialization", () => {
    const repository = createRepositoryMock();
    const service = createWellnessService(repository);

    service.initializeWellnessData();
    service.initializeWellnessData();

    expect(repository.seedGoals).toHaveBeenCalledTimes(1);
  });

  it("increments and decrements using metric step values", () => {
    const repository = createRepositoryMock();
    const service = createWellnessService(repository);

    service.incrementMetric("2026-02-11", "water");
    service.incrementMetric("2026-02-11", "water");
    service.decrementMetric("2026-02-11", "water");

    expect(repository.upsertMetric).toHaveBeenLastCalledWith("2026-02-11", "water", 1);
  });

  it("rejects invalid goal updates through metric validation", () => {
    const repository = createRepositoryMock();
    const service = createWellnessService(repository);

    expect(() => service.updateGoal("mood", 10)).toThrow();
    expect(repository.upsertGoal).not.toHaveBeenCalled();
  });
});
