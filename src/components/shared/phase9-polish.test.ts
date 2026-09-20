import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyLevel, createPlayableDemoLevel } from "@/json/level-schema";
import { useProjectStore } from "@/store/project-store";
import type { DetectionPrediction } from "@/types/detection";
import type { UploadedImageMetadata } from "@/types/upload";

describe("Phase 9: Final Polish & Production Readiness", () => {
  beforeEach(() => {
    useProjectStore.setState({
      activeProjectId: null,
      projectDetections: {},
      projectLevels: {},
      projects: [],
      projectUploads: {},
      studioDocuments: {},
    });
  });

  describe("Project Isolation & Data Integrity", () => {
    it("ensures Project A changes do not leak into Project B", () => {
      const store = useProjectStore.getState();

      const projA = store.createProject("Project Alpha");
      const projB = store.createProject("Project Beta");

      // Populate Project A with drawing, upload, detections, and level
      store.saveStudioDocument(projA.id, {
        canvasJson: JSON.stringify({ objects: [{ type: "rect" }] }),
        savedAt: new Date().toISOString(),
        version: 1,
        world: { height: 720, width: 1280 },
      });

      const uploadA: UploadedImageMetadata = {
        dimensions: { height: 600, width: 800 },
        fileName: "alpha.png",
        fileSize: 2048,
        mimeType: "image/png",
        uploadedAt: new Date().toISOString(),
      };
      store.setProjectUpload(projA.id, uploadA);

      const detectionsA: DetectionPrediction[] = [
        {
          boundingBox: { height: 40, width: 40, x: 20, y: 20 },
          className: "player",
          confidence: 0.92,
          id: "pred_a",
        },
      ];
      store.setProjectDetections(projA.id, detectionsA);

      const levelA = createPlayableDemoLevel("Alpha World");
      store.setProjectLevel(projA.id, levelA);

      // Verify Project B remains completely empty/isolated
      const state = useProjectStore.getState();
      expect(state.studioDocuments[projB.id]).toBeUndefined();
      expect(state.projectUploads[projB.id]).toBeUndefined();
      expect(state.projectDetections[projB.id]).toBeUndefined();
      expect(state.projectLevels[projB.id]).toBeUndefined();

      // Verify Project A has all expected state
      expect(state.studioDocuments[projA.id]).toBeDefined();
      expect(state.projectUploads[projA.id]?.fileName).toBe("alpha.png");
      expect(state.projectDetections[projA.id]).toHaveLength(1);
      expect(state.projectLevels[projA.id]?.name).toBe("Alpha World");
    });

    it("cascades project deletion cleanly without affecting other projects", () => {
      const store = useProjectStore.getState();

      const proj1 = store.createProject("Keeper");
      const proj2 = store.createProject("To Delete");

      store.setProjectLevel(proj1.id, createEmptyLevel("Keeper"));
      store.setProjectLevel(proj2.id, createEmptyLevel("To Delete"));

      // Delete proj2
      store.removeProject(proj2.id);

      const state = useProjectStore.getState();
      expect(state.projects.map((p) => p.id)).toEqual([proj1.id]);
      expect(state.projectLevels[proj2.id]).toBeUndefined();
      expect(state.projectLevels[proj1.id]).toBeDefined();
    });

    it("gracefully detects when a project ID does not exist in store", () => {
      const existing = useProjectStore.getState().createProject("Existing Project");

      const state = useProjectStore.getState();
      const lookupExisting = state.projects.find((p) => p.id === existing.id);
      expect(lookupExisting).toBeDefined();

      const lookupInvalid = state.projects.find((p) => p.id === "nonexistent-id-999");
      expect(lookupInvalid).toBeUndefined();
    });
  });

  describe("Stage Progression Integrity", () => {
    it("transitions project stage accurately from draft to uploaded, detected, and generated", () => {
      const store = useProjectStore.getState();
      const p = store.createProject("Stage Flow Test");

      expect(useProjectStore.getState().projects.find((x) => x.id === p.id)?.stage).toBe("draft");

      // 1. Upload stage
      store.setProjectUpload(p.id, {
        dimensions: { height: 100, width: 100 },
        fileName: "test.png",
        fileSize: 500,
        mimeType: "image/png",
        uploadedAt: new Date().toISOString(),
      });
      expect(useProjectStore.getState().projects.find((x) => x.id === p.id)?.stage).toBe("uploaded");

      // 2. Detected stage
      store.setProjectDetections(p.id, [
        {
          boundingBox: { height: 10, width: 10, x: 0, y: 0 },
          className: "coin",
          confidence: 0.88,
          id: "det_1",
        },
      ]);
      expect(useProjectStore.getState().projects.find((x) => x.id === p.id)?.stage).toBe("detected");

      // 3. Generated stage
      store.setProjectLevel(p.id, createPlayableDemoLevel("Playable Stage"));
      expect(useProjectStore.getState().projects.find((x) => x.id === p.id)?.stage).toBe("generated");
    });
  });
});
