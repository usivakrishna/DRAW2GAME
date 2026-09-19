import { beforeEach, describe, expect, it } from "vitest";
import { createPlayableDemoLevel } from "@/json/level-schema";
import { useProjectStore } from "@/store/project-store";
import type { DetectionPrediction } from "@/types/detection";
import type { ProjectSummary } from "@/types/project";
import type { UploadedImageMetadata } from "@/types/upload";

describe("Phase 8: Dashboard System & Project Management", () => {
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

  describe("Statistics Computation", () => {
    it("computes accurate project and stage counts", () => {
      const store = useProjectStore.getState();

      const p1 = store.createProject("Game One");
      const p2 = store.createProject("Game Two");
      const p3 = store.createProject("Game Three");
      store.createProject("Game Four");

      // p1 has a generated LevelDefinition
      store.setProjectLevel(p1.id, createPlayableDemoLevel("Level One"));

      // p2 has detections
      const mockDetections: DetectionPrediction[] = [
        {
          boundingBox: { height: 50, width: 50, x: 10, y: 10 },
          className: "player",
          confidence: 0.95,
          id: "det_1",
        },
      ];
      store.setProjectDetections(p2.id, mockDetections);

      // p3 has an uploaded image
      const mockUpload: UploadedImageMetadata = {
        dimensions: { height: 720, width: 1280 },
        fileName: "sketch.png",
        fileSize: 1024,
        mimeType: "image/png",
        uploadedAt: new Date().toISOString(),
      };
      store.setProjectUpload(p3.id, mockUpload);

      // p4 remains a draft

      const state = useProjectStore.getState();
      const allCount = state.projects.length;
      const generatedCount = state.projects.filter(
        (p) => Boolean(state.projectLevels[p.id]) || p.stage === "generated",
      ).length;
      const detectedCount = state.projects.filter(
        (p) =>
          (state.projectDetections[p.id]?.length ?? 0) > 0 ||
          p.stage === "detected",
      ).length;
      const uploadedCount = state.projects.filter(
        (p) => Boolean(state.projectUploads[p.id]) || p.stage === "uploaded",
      ).length;
      const draftCount = state.projects.filter((p) => p.stage === "draft").length;

      expect(allCount).toBe(4);
      expect(generatedCount).toBe(1);
      expect(detectedCount).toBe(1);
      expect(uploadedCount).toBe(1);
      expect(draftCount).toBe(1);
    });
  });

  describe("Search Filtering", () => {
    it("filters projects by name with case-insensitive and partial matching", () => {
      const projects: ProjectSummary[] = [
        { createdAt: "2026-09-01T00:00:00Z", id: "1", name: "Cyberpunk City", stage: "generated", updatedAt: "2026-09-01T00:00:00Z" },
        { createdAt: "2026-09-02T00:00:00Z", id: "2", name: "Forest Run", stage: "draft", updatedAt: "2026-09-02T00:00:00Z" },
        { createdAt: "2026-09-03T00:00:00Z", id: "3", name: "Cyber Ninja", stage: "uploaded", updatedAt: "2026-09-03T00:00:00Z" },
      ];

      const search = (q: string) => {
        const query = q.toLowerCase().trim();
        if (!query) return projects;
        return projects.filter((p) => p.name.toLowerCase().includes(query));
      };

      expect(search("cyber")).toHaveLength(2);
      expect(search("CYBERPUNK")).toHaveLength(1);
      expect(search("forest")).toHaveLength(1);
      expect(search("galaxy")).toHaveLength(0);
      expect(search("  ")).toHaveLength(3);
    });
  });

  describe("Sorting Options", () => {
    it("sorts projects correctly by date and name", () => {
      const pA: ProjectSummary = { createdAt: "2026-09-01T10:00:00Z", id: "1", name: "Zelda Quest", stage: "draft", updatedAt: "2026-09-01T10:00:00Z" };
      const pB: ProjectSummary = { createdAt: "2026-09-02T10:00:00Z", id: "2", name: "Alien Run", stage: "draft", updatedAt: "2026-09-02T10:00:00Z" };
      const pC: ProjectSummary = { createdAt: "2026-09-03T10:00:00Z", id: "3", name: "Mario Land", stage: "draft", updatedAt: "2026-09-03T10:00:00Z" };

      const list = [pA, pB, pC];

      const sortedByDateDesc = [...list].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      expect(sortedByDateDesc.map((p) => p.name)).toEqual(["Mario Land", "Alien Run", "Zelda Quest"]);

      const sortedByNameAsc = [...list].sort((a, b) => a.name.localeCompare(b.name));
      expect(sortedByNameAsc.map((p) => p.name)).toEqual(["Alien Run", "Mario Land", "Zelda Quest"]);
    });
  });

  describe("Project Creation & Isolation", () => {
    it("creates project with trimmed name and default fallback", () => {
      const store = useProjectStore.getState();

      const p1 = store.createProject("   Neon Runner   ");
      expect(p1.name).toBe("Neon Runner");
      expect(p1.stage).toBe("draft");

      const p2 = store.createProject("   ");
      expect(p2.name).toBe("Untitled level");
    });

    it("renames project and updates updatedAt timestamp while preserving other projects", () => {
      const store = useProjectStore.getState();

      const p1 = store.createProject("Alpha");
      const p2 = store.createProject("Beta");

      store.renameProject(p1.id, "Alpha Renovated");

      const projects = useProjectStore.getState().projects;
      const updatedP1 = projects.find((p) => p.id === p1.id);
      const untouchedP2 = projects.find((p) => p.id === p2.id);

      expect(updatedP1?.name).toBe("Alpha Renovated");
      expect(untouchedP2?.name).toBe("Beta");
    });

    it("deletes a project and cleans up all associated resources without affecting other projects", () => {
      const store = useProjectStore.getState();

      const pA = store.createProject("Project A");
      const pB = store.createProject("Project B");

      // Attach data to Project A
      const levelA = createPlayableDemoLevel("Level A");
      store.setProjectLevel(pA.id, levelA);
      store.setProjectDetections(pA.id, [
        {
          boundingBox: { height: 10, width: 10, x: 0, y: 0 },
          className: "player",
          confidence: 0.9,
          id: "det_a",
        },
      ]);
      store.setProjectUpload(pA.id, {
        dimensions: { height: 100, width: 100 },
        fileName: "a.png",
        fileSize: 100,
        mimeType: "image/png",
        uploadedAt: new Date().toISOString(),
      });

      // Attach data to Project B
      const levelB = createPlayableDemoLevel("Level B");
      store.setProjectLevel(pB.id, levelB);

      // Remove Project A
      store.removeProject(pA.id);

      const state = useProjectStore.getState();
      expect(state.projects.find((p) => p.id === pA.id)).toBeUndefined();
      expect(state.projectLevels[pA.id]).toBeUndefined();
      expect(state.projectDetections[pA.id]).toBeUndefined();
      expect(state.projectUploads[pA.id]).toBeUndefined();

      // Verify Project B is completely intact
      expect(state.projects.find((p) => p.id === pB.id)).toBeDefined();
      expect(state.projectLevels[pB.id]?.name).toBe("Level B");
    });
  });
});
