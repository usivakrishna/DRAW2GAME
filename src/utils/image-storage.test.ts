import { describe, expect, it } from "vitest";
import {
  deleteProjectImageBlob,
  getProjectImageBlob,
  saveProjectImageBlob,
} from "@/utils/image-storage";

describe("image-storage", () => {
  it("saves, retrieves, and deletes image blob for a project", async () => {
    const projectId = "project-test-123";
    const blob = new Blob(["mock-png-data"], { type: "image/png" });

    await saveProjectImageBlob(projectId, blob);

    const retrieved = await getProjectImageBlob(projectId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.type).toBe("image/png");

    await deleteProjectImageBlob(projectId);

    const afterDelete = await getProjectImageBlob(projectId);
    expect(afterDelete).toBeNull();
  });

  it("isolates image blobs between multiple projects", async () => {
    const projectA = "project-A";
    const projectB = "project-B";

    const blobA = new Blob(["blob-a-content"], { type: "image/png" });
    const blobB = new Blob(["blob-b-content"], { type: "image/jpeg" });

    await saveProjectImageBlob(projectA, blobA);
    await saveProjectImageBlob(projectB, blobB);

    const retrievedA = await getProjectImageBlob(projectA);
    const retrievedB = await getProjectImageBlob(projectB);

    expect(retrievedA?.type).toBe("image/png");
    expect(retrievedB?.type).toBe("image/jpeg");

    // Deleting project A does not affect project B
    await deleteProjectImageBlob(projectA);
    expect(await getProjectImageBlob(projectA)).toBeNull();
    expect(await getProjectImageBlob(projectB)).not.toBeNull();
  });
});
