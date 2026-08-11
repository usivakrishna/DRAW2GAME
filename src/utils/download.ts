export function downloadDataUrl(filename: string, dataUrl: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export function downloadTextFile(filename: string, content: string, mimeType = "application/json") {
  const blob = new Blob([content], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.download = filename;
  link.href = objectUrl;
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 0);
}
