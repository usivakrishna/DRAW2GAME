const DB_NAME = "draw2game_uploads_db";
const DB_VERSION = 1;
const STORE_NAME = "project_uploads";

// In-memory fallback for non-IndexedDB environments (e.g., unit tests, SSR, private browsing restrictions)
const memoryStore = new Map<string, Blob>();

function isIndexedDBAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open IndexedDB"));
    };
  });
}

/**
 * Save an uploaded image Blob for a project into IndexedDB (or memory fallback).
 */
export async function saveProjectImageBlob(
  projectId: string,
  blob: Blob,
): Promise<void> {
  if (!projectId) {
    throw new Error("projectId is required to save an image.");
  }

  // Always keep in memory store as immediate mirror/fallback
  memoryStore.set(projectId, blob);

  if (!isIndexedDBAvailable()) {
    return;
  }

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, projectId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("Failed to store blob in IndexedDB"));
      transaction.oncomplete = () => db.close();
    });
  } catch {
    // If IndexedDB write fails, memory store already holds the blob
  }
}

/**
 * Retrieve the uploaded image Blob for a project from IndexedDB (or memory fallback).
 */
export async function getProjectImageBlob(
  projectId: string,
): Promise<Blob | null> {
  if (!projectId) {
    return null;
  }

  if (isIndexedDBAvailable()) {
    try {
      const db = await openDatabase();
      const blob = await new Promise<Blob | null>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(projectId);

        request.onsuccess = () => {
          resolve((request.result as Blob) ?? null);
        };
        request.onerror = () => reject(request.error ?? new Error("Failed to read blob from IndexedDB"));
        transaction.oncomplete = () => db.close();
      });

      if (blob) {
        memoryStore.set(projectId, blob);
        return blob;
      }
    } catch {
      // Fallback to memory store if IndexedDB read fails
    }
  }

  return memoryStore.get(projectId) ?? null;
}

/**
 * Delete the uploaded image Blob for a project.
 */
export async function deleteProjectImageBlob(
  projectId: string,
): Promise<void> {
  if (!projectId) {
    return;
  }

  memoryStore.delete(projectId);

  if (!isIndexedDBAvailable()) {
    return;
  }

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(projectId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("Failed to delete blob from IndexedDB"));
      transaction.oncomplete = () => db.close();
    });
  } catch {
    // Ignore IndexedDB deletion errors
  }
}

/**
 * Convenience helper to get an HTMLImageElement for Phase 4 (OpenCV.js integration).
 */
export async function getProjectImageElement(
  projectId: string,
): Promise<HTMLImageElement | null> {
  const blob = await getProjectImageBlob(projectId);
  if (!blob) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load project image into HTMLImageElement."));
    };

    img.src = url;
  });
}
