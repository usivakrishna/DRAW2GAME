import { beforeEach, describe, expect, it } from "vitest";
import { useProjectStore } from "@/store/project-store";
import type { StudioDocument } from "@/types/studio";

describe("useProjectStore", () => {
  beforeEach(() => {
    useProjectStore.setState({
      activeProjectId: null,
      projects: [],
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
});
