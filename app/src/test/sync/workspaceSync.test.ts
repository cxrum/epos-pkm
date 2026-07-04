import { describe, expect, it } from "vitest";
import {
  applySnapshotDelta,
  docToSnapshot,
  snapshotToDoc,
  stableSerialize,
} from "@/core/sync/workspaceSync";

describe("workspace sync helpers", () => {
  it("round-trips snapshots through a Yjs doc", () => {
    const snapshot = {
      state: { title: "Workspace", selectedWorkspace: "abc" },
      files: {
        "workspace/root.json": { id: "-1", title: "root" },
        ".workspace": { id: "abc", title: "Workspace" },
      },
    };

    const doc = snapshotToDoc(snapshot);
    expect(docToSnapshot(doc)).toEqual(snapshot);
  });

  it("applies only changed keys from a local snapshot", () => {
    const baseSnapshot = {
      state: { title: "Workspace", selectedWorkspace: "abc" },
      files: {
        "workspace/root.json": { id: "-1", title: "root" },
        ".workspace": { id: "abc", title: "Workspace" },
      },
    };
    const currentSnapshot = {
      state: { title: "Workspace 2", selectedWorkspace: "abc" },
      files: {
        "workspace/root.json": { id: "-1", title: "root updated" },
      },
    };

    const doc = snapshotToDoc(baseSnapshot);
    const changed = applySnapshotDelta(doc, baseSnapshot, currentSnapshot);

    expect(changed).toBe(true);
    expect(docToSnapshot(doc)).toEqual(currentSnapshot);
  });

  it("serializes objects with stable key order", () => {
    expect(stableSerialize({ b: 1, a: { d: 2, c: 3 } })).toBe(
      '{"a":{"c":3,"d":2},"b":1}',
    );
  });
});
