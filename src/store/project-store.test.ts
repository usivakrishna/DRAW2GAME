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
});
