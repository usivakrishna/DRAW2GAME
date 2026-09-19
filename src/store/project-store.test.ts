import { beforeEach, describe, expect, it } from "vitest";
import { useProjectStore } from "@/store/project-store";
import type { StudioDocument } from "@/types/studio";

describe("useProjectStore", () => {
  beforeEach(() => {
    useProjectStore.setState({
      activeProjectId: null,
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
});
