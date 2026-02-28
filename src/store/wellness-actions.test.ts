import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("drizzle-orm/expo-sqlite", () => ({
  useLiveQuery: vi.fn(),
}));

const mockService = {
  initializeWellnessData: vi.fn(),
  updateMetric: vi.fn(),
  incrementMetric: vi.fn(),
  decrementMetric: vi.fn(),
  updateGoal: vi.fn(),
  resetDay: vi.fn(),
  clearAllData: vi.fn(),
};

vi.mock("@/features/wellness/application/wellness-service", () => ({
  createWellnessService: () => mockService,
}));

vi.mock("@/features/wellness/infra/wellness-repository", () => ({
  createDrizzleWellnessRepository: () => ({}),
}));

const bumpWellnessQueryVersion = vi.fn();

vi.mock("@/db/client", () => ({
  db: {},
}));

vi.mock("@/store/wellness-query-invalidation", () => ({
  bumpWellnessQueryVersion,
}));

describe("wellness store action wrappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when updateMetric succeeds", async () => {
    const { updateMetric } = await import("@/store/wellness-actions");

    expect(updateMetric("2026-02-11", "water", 3)).toBe(true);
    expect(mockService.updateMetric).toHaveBeenCalledWith("2026-02-11", "water", 3);
    expect(bumpWellnessQueryVersion).toHaveBeenCalledTimes(1);
  });

  it("returns false when incrementMetric throws", async () => {
    const errorSpy = vi.spyOn(globalThis.console, "error").mockImplementation(() => {});
    mockService.incrementMetric.mockImplementationOnce(() => {
      throw new Error("db failure");
    });

    const { incrementMetric } = await import("@/store/wellness-actions");

    expect(incrementMetric("2026-02-11", "water")).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    expect(bumpWellnessQueryVersion).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("returns false when updateGoal throws", async () => {
    const errorSpy = vi.spyOn(globalThis.console, "error").mockImplementation(() => {});
    mockService.updateGoal.mockImplementationOnce(() => {
      throw new Error("validation failure");
    });

    const { updateGoal } = await import("@/store/wellness-actions");

    expect(updateGoal("mood", 10)).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    expect(bumpWellnessQueryVersion).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("delegates reset and clear actions", async () => {
    const { resetDay, clearAllData } = await import("@/store/wellness-actions");

    expect(resetDay("2026-02-11")).toBe(true);
    expect(clearAllData()).toBe(true);

    expect(mockService.resetDay).toHaveBeenCalledWith("2026-02-11");
    expect(mockService.clearAllData).toHaveBeenCalledTimes(1);
    expect(bumpWellnessQueryVersion).toHaveBeenCalledTimes(2);
  });
});
