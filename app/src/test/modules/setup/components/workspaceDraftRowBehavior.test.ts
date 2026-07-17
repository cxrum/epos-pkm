import { describe, expect, it, vi } from "vitest";
import {
  focusAndSelectInput,
  resolveWorkspaceDraftRowAction,
} from "@/modules/setup/components/workspaceDraftRowBehavior";

describe("workspaceDraftRowBehavior", () => {
  it("maps Enter and Escape to the inline draft actions", () => {
    expect(resolveWorkspaceDraftRowAction("Enter")).toBe("commit");
    expect(resolveWorkspaceDraftRowAction("Escape")).toBe("cancel");
    expect(resolveWorkspaceDraftRowAction("Tab")).toBeNull();
  });

  it("focuses and selects the input when one is available", () => {
    const input = {
      focus: vi.fn(),
      select: vi.fn(),
    };

    focusAndSelectInput(input);

    expect(input.focus).toHaveBeenCalledTimes(1);
    expect(input.select).toHaveBeenCalledTimes(1);
  });
});
