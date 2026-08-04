import { create } from "zustand";

export type WorkspacePanel = "inspector" | "json" | null;

interface UiStore {
  activePanel: WorkspacePanel;
  isCommandPaletteOpen: boolean;
  setActivePanel: (panel: WorkspacePanel) => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  activePanel: null,
  isCommandPaletteOpen: false,
  setActivePanel: (activePanel) => {
    set({ activePanel });
  },
  setCommandPaletteOpen: (isCommandPaletteOpen) => {
    set({ isCommandPaletteOpen });
  },
}));
