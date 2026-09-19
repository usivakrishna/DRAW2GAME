import { beforeEach, describe, expect, it } from "vitest";
import { useProjectStore } from "@/store/project-store";
import type { StudioDocument } from "@/types/studio";

describe("useProjectStore", () => {
  beforeEach(() => {
    useProjectStore.setState({
      activeProjectId: null,
      projectDetections: {},
      projects: [],
      projectUploads: {},
      studioDocuments: {},
    });
  });

  it("creates a new project with default name if empty string provided", () => {
    const store = useProjectStore.getState();
    const project = store.createProject("");

    expect(project.name).toBe("Untitled level");
    expect(project.stage).toBe("draft");
    expect(useProjectStore.getState().activeProjectId).toBe(project.id);
    expect(useProjectStore.getState().projects).toHaveLength(1);
  });

  it("renames an existing project", () => {
    const store = useProjectStore.getState();
    const project = store.createProject("Initial Name");

    useProjectStore.getState().renameProject(project.id, "Super Mario Level 1");

    const updatedProject = useProjectStore
      .getState()
      .projects.find((p) => p.id === project.id);
    expect(updatedProject?.name).toBe("Super Mario Level 1");
  });

  it("saves and retrieves studio document", () => {
    const store = useProjectStore.getState();
    const project = store.createProject("Test Project");

    const doc: StudioDocument = {
      canvasJson: '{"version":"5.3.0","objects":[]}',
      savedAt: new Date().toISOString(),
      version: 1,
      world: { height: 1440, width: 2560 },
    };

    useProjectStore.getState().saveStudioDocument(project.id, doc);

    const retrievedDoc = useProjectStore.getState().studioDocuments[project.id];
    expect(retrievedDoc).toEqual(doc);
  });

  it("removes a project and associated studio document", () => {
    const store = useProjectStore.getState();
    const project = store.createProject("To Delete");

    const doc: StudioDocument = {
      canvasJson: '{"objects":[]}',
      savedAt: new Date().toISOString(),
      version: 1,
      world: { height: 1440, width: 2560 },
    };

    useProjectStore.getState().saveStudioDocument(project.id, doc);
    expect(useProjectStore.getState().projects).toHaveLength(1);

    useProjectStore.getState().removeProject(project.id);

    expect(useProjectStore.getState().projects).toHaveLength(0);
    expect(useProjectStore.getState().studioDocuments[project.id]).toBeUndefined();
  });

  it("maintains independent studio documents for multiple projects without cross-contamination", () => {
    const store = useProjectStore.getState();
    const projectA = store.createProject("Project A");
    const projectB = store.createProject("Project B");

    const docA: StudioDocument = {
      canvasJson: JSON.stringify({
        objects: [
          { type: "path", draw2game: { category: "drawing", type: "pencil" } },
          { type: "group", draw2game: { category: "game", type: "player" } },
          { type: "group", draw2game: { category: "game", type: "platform" } },
          { type: "group", draw2game: { category: "game", type: "coin" } },
        ],
      }),
      savedAt: new Date().toISOString(),
      version: 1,
      world: { height: 1440, width: 2560 },
    };

    const docB: StudioDocument = {
      canvasJson: JSON.stringify({
        objects: [
          { type: "path", draw2game: { category: "drawing", type: "pencil" } },
          { type: "group", draw2game: { category: "game", type: "enemy" } },
          { type: "group", draw2game: { category: "game", type: "spike" } },
          { type: "group", draw2game: { category: "game", type: "goal" } },
        ],
      }),
      savedAt: new Date().toISOString(),
      version: 1,
      world: { height: 1440, width: 2560 },
    };

    // Save documents for each project
    useProjectStore.getState().saveStudioDocument(projectA.id, docA);
    useProjectStore.getState().saveStudioDocument(projectB.id, docB);

    // Verify Project A has exactly Project A's document
    const retrievedA = useProjectStore.getState().studioDocuments[projectA.id];
    expect(retrievedA).toBeDefined();
    expect(retrievedA).toEqual(docA);
    const parsedA = JSON.parse(retrievedA?.canvasJson ?? "{}");
    expect(parsedA.objects).toHaveLength(4);
    expect(parsedA.objects.map((o: { draw2game: { type: string } }) => o.draw2game.type)).toEqual([
      "pencil",
      "player",
      "platform",
      "coin",
    ]);

    // Verify Project B has exactly Project B's document
    const retrievedB = useProjectStore.getState().studioDocuments[projectB.id];
    expect(retrievedB).toBeDefined();
    expect(retrievedB).toEqual(docB);
    const parsedB = JSON.parse(retrievedB?.canvasJson ?? "{}");
    expect(parsedB.objects).toHaveLength(4);
    expect(parsedB.objects.map((o: { draw2game: { type: string } }) => o.draw2game.type)).toEqual([
      "pencil",
      "enemy",
      "spike",
      "goal",
    ]);

    // Modifying Project A does not affect Project B
    const updatedDocA: StudioDocument = {
      ...docA,
      canvasJson: JSON.stringify({
        objects: [...parsedA.objects, { type: "rect", draw2game: { category: "drawing", type: "rectangle" } }],
      }),
      savedAt: new Date().toISOString(),
    };
    useProjectStore.getState().saveStudioDocument(projectA.id, updatedDocA);

    expect(useProjectStore.getState().studioDocuments[projectA.id]).toEqual(updatedDocA);
    expect(useProjectStore.getState().studioDocuments[projectB.id]).toEqual(docB);
  });

  describe("upload state and project isolation", () => {
    it("stores and retrieves uploaded image metadata for a project and sets stage to uploaded", () => {
      const store = useProjectStore.getState();
      const project = store.createProject("Upload Test");
      expect(project.stage).toBe("draft");

      const metadata = {
        dimensions: { height: 600, width: 800 },
        fileName: "sketch_level1.png",
        fileSize: 204800,
        mimeType: "image/png",
        uploadedAt: new Date().toISOString(),
      };

      store.setProjectUpload(project.id, metadata);

      const updatedUpload = useProjectStore.getState().projectUploads[project.id];
      expect(updatedUpload).toEqual(metadata);

      const updatedProject = useProjectStore
        .getState()
        .projects.find((p) => p.id === project.id);
      expect(updatedProject?.stage).toBe("uploaded");
    });

    it("maintains strict upload isolation between Project A and Project B", () => {
      const store = useProjectStore.getState();
      const projectA = store.createProject("Project A");
      const projectB = store.createProject("Project B");

      const uploadA = {
        dimensions: { height: 1080, width: 1920 },
        fileName: "level_a_sketch.png",
        fileSize: 512000,
        mimeType: "image/png",
        uploadedAt: "2026-09-19T10:00:00.000Z",
      };

      const uploadB = {
        dimensions: { height: 800, width: 1200 },
        fileName: "level_b_sketch.webp",
        fileSize: 256000,
        mimeType: "image/webp",
        uploadedAt: "2026-09-19T10:05:00.000Z",
      };

      store.setProjectUpload(projectA.id, uploadA);
      store.setProjectUpload(projectB.id, uploadB);

      const storeState = useProjectStore.getState();
      expect(storeState.projectUploads[projectA.id]).toEqual(uploadA);
      expect(storeState.projectUploads[projectB.id]).toEqual(uploadB);
      expect(storeState.projectUploads[projectA.id]?.fileName).toBe("level_a_sketch.png");
      expect(storeState.projectUploads[projectB.id]?.fileName).toBe("level_b_sketch.webp");
    });

    it("replaces upload metadata when new image is uploaded to the same project", () => {
      const store = useProjectStore.getState();
      const project = store.createProject("Replace Test");

      const initialUpload = {
        dimensions: { height: 400, width: 400 },
        fileName: "first.png",
        fileSize: 100000,
        mimeType: "image/png",
        uploadedAt: "2026-09-19T10:00:00.000Z",
      };

      const replacementUpload = {
        dimensions: { height: 800, width: 1200 },
        fileName: "second.jpg",
        fileSize: 250000,
        mimeType: "image/jpeg",
        uploadedAt: "2026-09-19T10:10:00.000Z",
      };

      store.setProjectUpload(project.id, initialUpload);
      expect(useProjectStore.getState().projectUploads[project.id]?.fileName).toBe("first.png");

      store.setProjectUpload(project.id, replacementUpload);
      expect(useProjectStore.getState().projectUploads[project.id]?.fileName).toBe("second.jpg");
      expect(useProjectStore.getState().projectUploads[project.id]?.fileSize).toBe(250000);
    });

    it("removes upload metadata and resets stage to draft without touching studioDocuments", () => {
      const store = useProjectStore.getState();
      const project = store.createProject("Drawing + Upload");

      // Save drawing document
      const doc: StudioDocument = {
        canvasJson: JSON.stringify({
          objects: [{ type: "group", draw2game: { category: "game", type: "player" } }],
        }),
        savedAt: new Date().toISOString(),
        version: 1,
        world: { height: 1440, width: 2560 },
      };
      store.saveStudioDocument(project.id, doc);

      // Save upload
      const upload = {
        dimensions: { height: 600, width: 800 },
        fileName: "sketch.png",
        fileSize: 150000,
        mimeType: "image/png",
        uploadedAt: new Date().toISOString(),
      };
      store.setProjectUpload(project.id, upload);

      expect(useProjectStore.getState().projectUploads[project.id]).toBeDefined();
      expect(useProjectStore.getState().studioDocuments[project.id]).toBeDefined();

      // Remove upload
      store.removeProjectUpload(project.id);

      // Upload should be cleared
      expect(useProjectStore.getState().projectUploads[project.id]).toBeUndefined();

      // Stage should revert to draft
      const proj = useProjectStore.getState().projects.find((p) => p.id === project.id);
      expect(proj?.stage).toBe("draft");

      // Drawing Studio documents must remain completely intact!
      expect(useProjectStore.getState().studioDocuments[project.id]).toEqual(doc);
    });

    it("cleans up upload metadata when project is deleted", () => {
      const store = useProjectStore.getState();
      const project = store.createProject("To Delete With Upload");

      const upload = {
        dimensions: { height: 600, width: 800 },
        fileName: "sketch.png",
        fileSize: 150000,
        mimeType: "image/png",
        uploadedAt: new Date().toISOString(),
      };
      store.setProjectUpload(project.id, upload);

      expect(useProjectStore.getState().projectUploads[project.id]).toBeDefined();

      store.removeProject(project.id);

      expect(useProjectStore.getState().projectUploads[project.id]).toBeUndefined();
      expect(useProjectStore.getState().projects).toHaveLength(0);
    });
  });

  describe("detection state and project isolation", () => {
    it("stores and retrieves detection predictions and updates project stage to detected", () => {
      const store = useProjectStore.getState();
      const project = store.createProject("Detection Test");

      const predictions = [
        {
          boundingBox: { height: 60, width: 40, x: 100, y: 200 },
          className: "player" as const,
          confidence: 0.94,
          id: "pred-1",
        },
        {
          boundingBox: { height: 20, width: 200, x: 50, y: 350 },
          className: "platform" as const,
          confidence: 0.91,
          id: "pred-2",
        },
      ];

      store.setProjectDetections(project.id, predictions);

      const retrieved = useProjectStore.getState().projectDetections[project.id];
      expect(retrieved).toEqual(predictions);

      const updatedProject = useProjectStore
        .getState()
        .projects.find((p) => p.id === project.id);
      expect(updatedProject?.stage).toBe("detected");
    });

    it("maintains strict detection isolation between Project A and Project B", () => {
      const store = useProjectStore.getState();
      const projectA = store.createProject("Project A");
      const projectB = store.createProject("Project B");

      const detectionsA = [
        {
          boundingBox: { height: 50, width: 50, x: 10, y: 20 },
          className: "player" as const,
          confidence: 0.95,
          id: "a-1",
        },
      ];

      const detectionsB = [
        {
          boundingBox: { height: 30, width: 30, x: 300, y: 150 },
          className: "coin" as const,
          confidence: 0.88,
          id: "b-1",
        },
        {
          boundingBox: { height: 40, width: 40, x: 400, y: 200 },
          className: "enemy" as const,
          confidence: 0.82,
          id: "b-2",
        },
      ];

      store.setProjectDetections(projectA.id, detectionsA);
      store.setProjectDetections(projectB.id, detectionsB);

      const storeState = useProjectStore.getState();
      expect(storeState.projectDetections[projectA.id]).toEqual(detectionsA);
      expect(storeState.projectDetections[projectB.id]).toEqual(detectionsB);
      expect(storeState.projectDetections[projectA.id]).toHaveLength(1);
      expect(storeState.projectDetections[projectB.id]).toHaveLength(2);
    });

    it("clearing detections resets stage to uploaded if upload exists, preserving drawings", () => {
      const store = useProjectStore.getState();
      const project = store.createProject("Full Project");

      // Save drawing document
      const doc = {
        canvasJson: '{"objects":[]}',
        savedAt: new Date().toISOString(),
        version: 1 as const,
        world: { height: 1440, width: 2560 },
      };
      store.saveStudioDocument(project.id, doc);

      // Save upload
      store.setProjectUpload(project.id, {
        dimensions: { height: 500, width: 500 },
        fileName: "test.png",
        fileSize: 50000,
        mimeType: "image/png",
        uploadedAt: new Date().toISOString(),
      });
      expect(useProjectStore.getState().projects[0]?.stage).toBe("uploaded");

      // Save detections
      store.setProjectDetections(project.id, [
        {
          boundingBox: { height: 50, width: 50, x: 0, y: 0 },
          className: "goal" as const,
          confidence: 0.99,
          id: "goal-1",
        },
      ]);
      expect(useProjectStore.getState().projects[0]?.stage).toBe("detected");

      // Clear detections
      store.clearProjectDetections(project.id);

      // Detections should be empty
      expect(useProjectStore.getState().projectDetections[project.id]).toBeUndefined();

      // Stage should revert to uploaded (since upload still exists)
      expect(useProjectStore.getState().projects[0]?.stage).toBe("uploaded");

      // Drawing document should remain intact
      expect(useProjectStore.getState().studioDocuments[project.id]).toEqual(doc);
    });

    it("cleans up detection results when project is deleted", () => {
      const store = useProjectStore.getState();
      const project = store.createProject("To Delete Detections");

      store.setProjectDetections(project.id, [
        {
          boundingBox: { height: 10, width: 10, x: 0, y: 0 },
          className: "spike" as const,
          confidence: 0.75,
          id: "spike-1",
        },
      ]);
      expect(useProjectStore.getState().projectDetections[project.id]).toBeDefined();

      store.removeProject(project.id);

      expect(useProjectStore.getState().projectDetections[project.id]).toBeUndefined();
      expect(useProjectStore.getState().projects).toHaveLength(0);
    });
  });
});
