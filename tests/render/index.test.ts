import { describe, it, expect, vi, beforeEach } from "vitest";
import render from "../../src/render/index.js";
import signale from "signale";
import chalk from "chalk";

vi.mock("signale", () => {
  const mockSignale = {
    config: vi.fn(),
    log: vi.fn(),
    note: vi.fn(),
    pending: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    await: vi.fn(),
  };
  return {
    default: mockSignale,
  };
});

vi.mock("chalk", () => ({
  default: {
    blue: vi.fn((s) => s),
    green: vi.fn((s) => s),
    grey: vi.fn((s) => s),
    magenta: vi.fn((s) => s),
    red: vi.fn((s) => s),
    underline: vi.fn((s) => s),
    yellow: vi.fn((s) => s),
  },
}));

describe("Render", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call successCreate with correct parameters", () => {
    const id = "123";
    render.successCreate(id);
    expect(signale.success).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Created task:",
        suffix: expect.any(String),
      })
    );
  });

  it("should call successEdit with correct parameters", () => {
    const id = "123";
    render.successEdit(id);
    expect(signale.success).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Updated item:",
        suffix: expect.any(String),
      })
    );
  });

  it("should call successDelete with correct parameters", () => {
    const id = "123";
    render.successDelete(id);
    expect(signale.success).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Deleted item:",
        suffix: expect.any(String),
      })
    );
  });

  it("formatNow shows current task with total time, else next, else nothing", () => {
    const current = {
      title: "Write report",
      timeSpent: 60 * 60000,
      lastStartedAt: new Date(Date.now() - 5 * 60000),
      estimatedTime: 90,
    } as any;
    expect(render.formatNow(current)).toBe("▶ Write report · 1h 5m / 1h 30m");
    expect(render.formatNow({ ...current, estimatedTime: 30 })).toBe(
      "▶ Write report · 1h 5m / 30m ⚠ over"
    );
    expect(render.formatNow(undefined, { title: "Email", externalId: 3 } as any)).toBe(
      "Next: Email (k start 3)"
    );
    expect(render.formatNow()).toBe("Nothing to do");
  });
});
