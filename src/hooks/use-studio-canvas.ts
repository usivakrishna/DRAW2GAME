import { useCallback, useEffect, useRef, useState } from "react";
import {
  Canvas,
  Circle,
  FabricObject,
  FabricText,
  Group,
  IText,
  Line,
  PencilBrush,
  Point,
  Rect,
  Text,
  Triangle,
  type TMat2D,
  type TPointerEvent,
  type TPointerEventInfo,
} from "fabric";
import {
  DEFAULT_STUDIO_WORLD,
  GAME_OBJECT_TYPES,
  type GameObjectType,
  type StudioObjectMetadata,
  type StudioObjectType,
  type StudioTool,
  type StudioWorldSize,
} from "@/types/studio";
import { createId } from "@/utils/ids";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const HISTORY_LIMIT = 60;
const CUSTOM_PROPERTY = "draw2game";

type StudioFabricObject = FabricObject & {
  draw2game?: StudioObjectMetadata;
};

type ShapeTool = Extract<StudioTool, "rectangle" | "circle" | "line">;

interface CanvasHistory {
  redo: string[];
  undo: string[];
}

interface DrawingSession {
  object: FabricObject;
  startPoint: Point;
  tool: ShapeTool;
}

export type InspectorProperty =
  | "angle"
  | "color"
  | "height"
  | "isLocked"
  | "left"
  | "scaleX"
  | "scaleY"
  | "top"
  | "width";

export interface InspectorValues {
  angle: number;
  color: string;
  height: number;
  isLocked: boolean;
  left: number;
  scaleX: number;
  scaleY: number;
  top: number;
  type: StudioObjectType | string;
  width: number;
}

interface UseStudioCanvasOptions {
  activeTool: StudioTool;
  onSave?: () => void;
  onSelectionChange?: (object: FabricObject | null, selectedCount: number) => void;
}

function isEditableElement(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function isGameObjectType(type: StudioTool): type is GameObjectType {
  return GAME_OBJECT_TYPES.some((candidate) => candidate === type);
}

function isShapeTool(tool: StudioTool): tool is ShapeTool {
  return tool === "rectangle" || tool === "circle" || tool === "line";
}

function cloneViewportTransform(viewportTransform: TMat2D): TMat2D {
  return [
    viewportTransform[0],
    viewportTransform[1],
    viewportTransform[2],
    viewportTransform[3],
    viewportTransform[4],
    viewportTransform[5],
  ];
}

function clampZoom(value: number) {
  return Math.min(Math.max(value, MIN_ZOOM), MAX_ZOOM);
}

function getPointerPosition(event: TPointerEvent) {
  if ("touches" in event) {
    const touch = event.touches[0] ?? event.changedTouches[0];

    return touch
      ? {
          x: touch.clientX,
          y: touch.clientY,
        }
      : null;
  }

  return {
    x: event.clientX,
    y: event.clientY,
  };
}

function getStudioObject(object: FabricObject) {
  return object as StudioFabricObject;
}

function getObjectType(object: FabricObject) {
  return getStudioObject(object).draw2game?.type ?? object.type;
}

function assignMetadata(object: FabricObject, type: StudioObjectType) {
  getStudioObject(object).draw2game = {
    category: isGameObjectType(type) ? "game" : "drawing",
    id: createId("object"),
    type,
  };

  return object;
}

function registerCustomProperties() {
  const fabricClasses = [
    FabricObject,
    Group,
    Rect,
    Circle,
    Line,
    Triangle,
    FabricText,
    Text,
    IText,
  ];

  fabricClasses.forEach((fabricClass) => {
    if (!fabricClass.customProperties.includes(CUSTOM_PROPERTY)) {
      fabricClass.customProperties = [...fabricClass.customProperties, CUSTOM_PROPERTY];
    }
  });
}

function serializeCanvas(canvas: Canvas) {
  return JSON.stringify(canvas.toJSON());
}

function createDrawingObject(tool: ShapeTool, point: Point) {
  const sharedOptions = {
    fill: "rgba(37, 99, 235, 0.08)",
    left: point.x,
    originX: "left" as const,
    originY: "top" as const,
    stroke: "#2563eb",
    strokeUniform: true,
    strokeWidth: 2,
    top: point.y,
  };

  switch (tool) {
    case "rectangle":
      return assignMetadata(
        new Rect({
          ...sharedOptions,
          height: 1,
          rx: 6,
          ry: 6,
          width: 1,
        }),
        tool,
      );
    case "circle":
      return assignMetadata(
        new Circle({
          ...sharedOptions,
          radius: 0.5,
        }),
        tool,
      );
    case "line":
      return assignMetadata(
        new Line([point.x, point.y, point.x, point.y], {
          fill: "",
          stroke: "#2563eb",
          strokeLineCap: "round",
          strokeUniform: true,
          strokeWidth: 3,
        }),
        tool,
      );
  }
}

function createGoalObject(point: Point) {
  const pole = new Rect({
    fill: "#475569",
    height: 76,
    left: -18,
    originX: "center",
    originY: "center",
    rx: 2,
    ry: 2,
    top: 0,
    width: 4,
  });
  const flag = new Triangle({
    angle: 90,
    fill: "#8b5cf6",
    height: 26,
    left: 2,
    originX: "center",
    originY: "center",
    top: -24,
    width: 30,
  });
  const marker = new Circle({
    fill: "#c4b5fd",
    left: -18,
    originX: "center",
    originY: "center",
    radius: 5,
    top: -40,
  });
  const label = new FabricText("GOAL", {
    fill: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
    left: 2,
    originX: "center",
    originY: "center",
    top: -24,
  });

  return assignMetadata(
    new Group([pole, flag, marker, label], {
      left: point.x,
      originX: "center",
      originY: "center",
      top: point.y,
    }),
    "goal",
  );
}

function createGameObject(type: GameObjectType, point: Point) {
  switch (type) {
    case "player": {
      const shape = new Rect({
        fill: "#2563eb",
        height: 52,
        originX: "center",
        originY: "center",
        rx: 8,
        ry: 8,
        stroke: "#1d4ed8",
        strokeWidth: 2,
        width: 38,
      });
      const label = new FabricText("P1", {
        fill: "#ffffff",
        fontSize: 12,
        fontWeight: "bold",
        originX: "center",
        originY: "center",
      });
      return assignMetadata(
        new Group([shape, label], {
          left: point.x,
          originX: "center",
          originY: "center",
          top: point.y,
        }),
        type,
      );
    }
    case "platform": {
      const shape = new Rect({
        fill: "#10b981",
        height: 32,
        originX: "center",
        originY: "center",
        rx: 6,
        ry: 6,
        stroke: "#047857",
        strokeWidth: 2,
        width: 184,
      });
      const label = new FabricText("PLATFORM", {
        fill: "#ffffff",
        fontSize: 11,
        fontWeight: "bold",
        originX: "center",
        originY: "center",
      });
      return assignMetadata(
        new Group([shape, label], {
          left: point.x,
          originX: "center",
          originY: "center",
          top: point.y,
        }),
        type,
      );
    }
    case "enemy": {
      const shape = new Rect({
        fill: "#ef4444",
        height: 44,
        originX: "center",
        originY: "center",
        rx: 8,
        ry: 8,
        stroke: "#b91c1c",
        strokeWidth: 2,
        width: 44,
      });
      const label = new FabricText("ENEMY", {
        fill: "#ffffff",
        fontSize: 10,
        fontWeight: "bold",
        originX: "center",
        originY: "center",
      });
      return assignMetadata(
        new Group([shape, label], {
          left: point.x,
          originX: "center",
          originY: "center",
          top: point.y,
        }),
        type,
      );
    }
    case "coin": {
      const shape = new Circle({
        fill: "#fbbf24",
        originX: "center",
        originY: "center",
        radius: 18,
        stroke: "#d97706",
        strokeWidth: 3,
      });
      const label = new FabricText("★", {
        fill: "#78350f",
        fontSize: 14,
        fontWeight: "bold",
        originX: "center",
        originY: "center",
      });
      return assignMetadata(
        new Group([shape, label], {
          left: point.x,
          originX: "center",
          originY: "center",
          top: point.y,
        }),
        type,
      );
    }
    case "spike": {
      const shape = new Triangle({
        fill: "#475569",
        height: 32,
        originX: "center",
        originY: "center",
        stroke: "#1e293b",
        strokeWidth: 2,
        width: 38,
      });
      const label = new FabricText("▲", {
        fill: "#ffffff",
        fontSize: 10,
        fontWeight: "bold",
        originX: "center",
        originY: "center",
        top: 4,
      });
      return assignMetadata(
        new Group([shape, label], {
          left: point.x,
          originX: "center",
          originY: "center",
          top: point.y,
        }),
        type,
      );
    }
    case "goal":
      return createGoalObject(point);
  }
}

function applyToolToCanvas(canvas: Canvas, tool: StudioTool) {
  const selectMode = tool === "select";
  const eraserMode = tool === "eraser";

  canvas.isDrawingMode = tool === "pencil";
  canvas.selection = selectMode;
  canvas.defaultCursor =
    tool === "pan" ? "grab" : eraserMode ? "crosshair" : selectMode ? "default" : "crosshair";
  canvas.hoverCursor = eraserMode ? "not-allowed" : selectMode ? "move" : "crosshair";

  canvas.getObjects().forEach((object) => {
    object.selectable = selectMode;
    object.evented = selectMode || eraserMode;
  });

  if (!selectMode) {
    canvas.discardActiveObject();
  }

  canvas.requestRenderAll();
}

export function getInspectorValues(object: FabricObject): InspectorValues {
  let color = "#2563eb";

  if (object instanceof Group) {
    const firstShape = object.getObjects()[0];
    if (firstShape) {
      color =
        (firstShape.get("fill") as string) ||
        (firstShape.get("stroke") as string) ||
        "#2563eb";
    }
  } else {
    color =
      (object.get("fill") as string) ||
      (object.get("stroke") as string) ||
      "#2563eb";
  }

  return {
    angle: Math.round(object.angle ?? 0),
    color,
    height: Math.round(object.getScaledHeight()),
    isLocked: Boolean(object.lockMovementX),
    left: Math.round(object.left ?? 0),
    scaleX: Number((object.scaleX ?? 1).toFixed(2)),
    scaleY: Number((object.scaleY ?? 1).toFixed(2)),
    top: Math.round(object.top ?? 0),
    type: getObjectType(object),
    width: Math.round(object.getScaledWidth()),
  };
}

export function useStudioCanvas({ activeTool, onSave, onSelectionChange }: UseStudioCanvasOptions) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const drawingSessionRef = useRef<DrawingSession | null>(null);
  const historyRef = useRef<CanvasHistory>({ redo: [], undo: [] });
  const isPanningRef = useRef(false);
  const isRestoringRef = useRef(false);
  const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const onSaveRef = useRef(onSave);
  const spacePressedRef = useRef(false);
  const activeToolRef = useRef(activeTool);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [historyState, setHistoryState] = useState({
    canRedo: false,
    canUndo: false,
  });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    activeToolRef.current = activeTool;
    const fabricCanvas = canvasRef.current;

    if (fabricCanvas) {
      applyToolToCanvas(fabricCanvas, activeTool);
      onSelectionChangeRef.current?.(null, 0);
    }
  }, [activeTool]);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const syncHistoryState = useCallback(() => {
    setHistoryState({
      canRedo: historyRef.current.redo.length > 0,
      canUndo: historyRef.current.undo.length > 1,
    });
  }, []);

  const notifySelection = useCallback(() => {
    const fabricCanvas = canvasRef.current;

    if (!fabricCanvas) {
      onSelectionChangeRef.current?.(null, 0);
      return;
    }

    const activeObjects = fabricCanvas.getActiveObjects();
    onSelectionChangeRef.current?.(
      activeObjects.length === 1 ? (activeObjects[0] ?? null) : null,
      activeObjects.length,
    );
  }, []);

  const commitHistory = useCallback(() => {
    const fabricCanvas = canvasRef.current;

    if (!fabricCanvas || isRestoringRef.current) {
      return;
    }

    const snapshot = serializeCanvas(fabricCanvas);
    const currentSnapshot = historyRef.current.undo.at(-1);

    if (snapshot === currentSnapshot) {
      return;
    }

    historyRef.current = {
      redo: [],
      undo: [...historyRef.current.undo, snapshot].slice(-HISTORY_LIMIT),
    };
    syncHistoryState();
  }, [syncHistoryState]);

  const restoreSnapshot = useCallback(
    async (snapshot: string) => {
      const fabricCanvas = canvasRef.current;

      if (!fabricCanvas) {
        return;
      }

      const parsedSnapshot = JSON.parse(snapshot) as Record<string, unknown>;
      isRestoringRef.current = true;

      try {
        fabricCanvas.discardActiveObject();
        await fabricCanvas.loadFromJSON(parsedSnapshot);
        applyToolToCanvas(fabricCanvas, activeToolRef.current);
        fabricCanvas.requestRenderAll();
        setZoom(fabricCanvas.getZoom());
        notifySelection();
      } finally {
        isRestoringRef.current = false;
      }
    },
    [notifySelection],
  );

  const deleteSelected = useCallback(() => {
    const fabricCanvas = canvasRef.current;
    const activeObjects = fabricCanvas?.getActiveObjects() ?? [];

    if (!fabricCanvas || activeObjects.length === 0) {
      return false;
    }

    activeObjects.forEach((object) => {
      fabricCanvas.remove(object);
    });
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
    commitHistory();
    notifySelection();
    return true;
  }, [commitHistory, notifySelection]);

  const undo = useCallback(async () => {
    const currentHistory = historyRef.current;
    const currentSnapshot = currentHistory.undo.at(-1);
    const previousSnapshot = currentHistory.undo.at(-2);

    if (!currentSnapshot || !previousSnapshot) {
      return;
    }

    historyRef.current = {
      redo: [currentSnapshot, ...currentHistory.redo],
      undo: currentHistory.undo.slice(0, -1),
    };
    syncHistoryState();
    await restoreSnapshot(previousSnapshot);
  }, [restoreSnapshot, syncHistoryState]);

  const redo = useCallback(async () => {
    const currentHistory = historyRef.current;
    const nextSnapshot = currentHistory.redo[0];
    const currentSnapshot = currentHistory.undo.at(-1);

    if (!nextSnapshot || !currentSnapshot) {
      return;
    }

    historyRef.current = {
      redo: currentHistory.redo.slice(1),
      undo: [...currentHistory.undo, nextSnapshot],
    };
    syncHistoryState();
    await restoreSnapshot(nextSnapshot);
  }, [restoreSnapshot, syncHistoryState]);

  useEffect(() => {
    const canvasElement = canvasElementRef.current;
    const container = canvasContainerRef.current;

    if (!canvasElement || !container) {
      return;
    }

    registerCustomProperties();

    const fabricCanvas = new Canvas(canvasElement, {
      backgroundColor: "transparent",
      fireRightClick: false,
      preserveObjectStacking: true,
      selectionColor: "rgba(37, 99, 235, 0.12)",
      selectionLineWidth: 1,
    });
    const pencilBrush = new PencilBrush(fabricCanvas);

    pencilBrush.color = "#1d4ed8";
    pencilBrush.width = 3;
    fabricCanvas.freeDrawingBrush = pencilBrush;
    canvasRef.current = fabricCanvas;
    setCanvas(fabricCanvas);

    const updateCanvasSize = () => {
      const bounds = container.getBoundingClientRect();

      if (bounds.width < 1 || bounds.height < 1) {
        return;
      }

      const viewportTransform = cloneViewportTransform(fabricCanvas.viewportTransform);
      fabricCanvas.setDimensions({
        height: Math.max(360, Math.floor(bounds.height)),
        width: Math.max(320, Math.floor(bounds.width)),
      });
      fabricCanvas.setViewportTransform(viewportTransform);
      fabricCanvas.requestRenderAll();
    };

    const reportSelection = () => {
      notifySelection();
    };

    const handleObjectModified = () => {
      commitHistory();
      notifySelection();
    };

    const handlePathCreated = ({ path }: { path: FabricObject }) => {
      assignMetadata(path, "pencil");
      path.setCoords();
      commitHistory();
    };

    const handleMouseDown = (event: TPointerEventInfo) => {
      const currentTool = activeToolRef.current;
      const pointerPosition = getPointerPosition(event.e);
      const shouldPan =
        currentTool === "pan" ||
        spacePressedRef.current ||
        (!("touches" in event.e) && event.e.button === 1);

      if (shouldPan && pointerPosition) {
        isPanningRef.current = true;
        lastPanPointRef.current = pointerPosition;
        fabricCanvas.defaultCursor = "grabbing";
        return;
      }

      if (currentTool === "eraser" && event.target) {
        fabricCanvas.remove(event.target);
        fabricCanvas.discardActiveObject();
        fabricCanvas.requestRenderAll();
        commitHistory();
        notifySelection();
        return;
      }

      if (isGameObjectType(currentTool)) {
        const gameObject = createGameObject(currentTool, event.scenePoint);
        fabricCanvas.add(gameObject);
        gameObject.setCoords();
        fabricCanvas.requestRenderAll();
        commitHistory();
        return;
      }

      if (isShapeTool(currentTool)) {
        const drawingObject = createDrawingObject(currentTool, event.scenePoint);
        drawingSessionRef.current = {
          object: drawingObject,
          startPoint: event.scenePoint,
          tool: currentTool,
        };
        fabricCanvas.add(drawingObject);
        return;
      }
    };

    const handleMouseMove = (event: TPointerEventInfo) => {
      if (isPanningRef.current) {
        const pointerPosition = getPointerPosition(event.e);
        const lastPanPoint = lastPanPointRef.current;

        if (!pointerPosition || !lastPanPoint) {
          return;
        }

        const viewportTransform = cloneViewportTransform(fabricCanvas.viewportTransform);
        viewportTransform[4] += pointerPosition.x - lastPanPoint.x;
        viewportTransform[5] += pointerPosition.y - lastPanPoint.y;
        fabricCanvas.setViewportTransform(viewportTransform);
        fabricCanvas.requestRenderAll();
        lastPanPointRef.current = pointerPosition;
        return;
      }

      if (activeToolRef.current === "eraser" && event.target && "buttons" in event.e && event.e.buttons === 1) {
        fabricCanvas.remove(event.target);
        fabricCanvas.discardActiveObject();
        fabricCanvas.requestRenderAll();
        commitHistory();
        notifySelection();
        return;
      }

      const drawingSession = drawingSessionRef.current;

      if (!drawingSession) {
        return;
      }

      const { object, startPoint, tool } = drawingSession;
      const deltaX = event.scenePoint.x - startPoint.x;
      const deltaY = event.scenePoint.y - startPoint.y;

      if (tool === "line" && object instanceof Line) {
        object.set({
          x2: event.scenePoint.x,
          y2: event.scenePoint.y,
        });
      } else if (tool === "rectangle" && object instanceof Rect) {
        object.set({
          height: Math.max(Math.abs(deltaY), 1),
          left: Math.min(startPoint.x, event.scenePoint.x),
          top: Math.min(startPoint.y, event.scenePoint.y),
          width: Math.max(Math.abs(deltaX), 1),
        });
      } else if (tool === "circle" && object instanceof Circle) {
        const diameter = Math.max(Math.abs(deltaX), Math.abs(deltaY), 1);

        object.set({
          left: deltaX < 0 ? startPoint.x - diameter : startPoint.x,
          radius: diameter / 2,
          top: deltaY < 0 ? startPoint.y - diameter : startPoint.y,
        });
      }

      object.setCoords();
      fabricCanvas.requestRenderAll();
    };

    const handleMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        lastPanPointRef.current = null;
        applyToolToCanvas(fabricCanvas, activeToolRef.current);
        return;
      }

      const drawingSession = drawingSessionRef.current;

      if (!drawingSession) {
        return;
      }

      const { object, tool } = drawingSession;

      if (tool === "rectangle" && object instanceof Rect) {
        if (object.width < 5 || object.height < 5) {
          object.set({
            height: 70,
            width: 120,
          });
        }
      } else if (tool === "circle" && object instanceof Circle) {
        if (object.radius < 3) {
          object.set({
            radius: 35,
          });
        }
      } else if (tool === "line" && object instanceof Line) {
        if (Math.abs(object.x2 - object.x1) < 5 && Math.abs(object.y2 - object.y1) < 5) {
          object.set({
            x2: object.x1 + 120,
            y2: object.y1,
          });
        }
      }

      drawingSession.object.setCoords();
      drawingSessionRef.current = null;
      fabricCanvas.requestRenderAll();
      commitHistory();
    };

    const handleWheel = (event: TPointerEventInfo<WheelEvent>) => {
      const nextZoom = clampZoom(fabricCanvas.getZoom() * Math.pow(0.999, -event.e.deltaY));

      fabricCanvas.zoomToPoint(event.viewportPoint, nextZoom);
      fabricCanvas.requestRenderAll();
      setZoom(nextZoom);
      event.e.preventDefault();
      event.e.stopPropagation();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableElement(event.target)) {
        return;
      }

      if (event.code === "Space") {
        spacePressedRef.current = true;
        event.preventDefault();
        return;
      }

      const isMetaOrCtrl = event.metaKey || event.ctrlKey;

      if (isMetaOrCtrl && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          void redo();
        } else {
          void undo();
        }
        return;
      }

      if (isMetaOrCtrl && event.key.toLowerCase() === "y") {
        event.preventDefault();
        void redo();
        return;
      }

      if (isMetaOrCtrl && event.key.toLowerCase() === "s") {
        event.preventDefault();
        onSaveRef.current?.();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        const currentFabricCanvas = canvasRef.current;
        if (currentFabricCanvas && currentFabricCanvas.getActiveObjects().length > 0) {
          event.preventDefault();
          deleteSelected();
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        spacePressedRef.current = false;
      }
    };

    const handleBlur = () => {
      spacePressedRef.current = false;
      isPanningRef.current = false;
      lastPanPointRef.current = null;
      applyToolToCanvas(fabricCanvas, activeToolRef.current);
    };

    const resizeObserver = new ResizeObserver(updateCanvasSize);

    resizeObserver.observe(container);
    updateCanvasSize();
    applyToolToCanvas(fabricCanvas, activeToolRef.current);
    historyRef.current = {
      redo: [],
      undo: [serializeCanvas(fabricCanvas)],
    };
    syncHistoryState();

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);
    fabricCanvas.on("mouse:wheel", handleWheel);
    fabricCanvas.on("object:modified", handleObjectModified);
    fabricCanvas.on("path:created", handlePathCreated);
    fabricCanvas.on("selection:created", reportSelection);
    fabricCanvas.on("selection:updated", reportSelection);
    fabricCanvas.on("selection:cleared", reportSelection);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      resizeObserver.disconnect();
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
      fabricCanvas.off("mouse:wheel", handleWheel);
      fabricCanvas.off("object:modified", handleObjectModified);
      fabricCanvas.off("path:created", handlePathCreated);
      fabricCanvas.off("selection:created", reportSelection);
      fabricCanvas.off("selection:updated", reportSelection);
      fabricCanvas.off("selection:cleared", reportSelection);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);

      if (canvasRef.current === fabricCanvas) {
        canvasRef.current = null;
      }

      void fabricCanvas.dispose();
    };
  }, [commitHistory, deleteSelected, notifySelection, redo, syncHistoryState, undo]);

  const clearCanvas = useCallback(() => {
    const fabricCanvas = canvasRef.current;

    if (!fabricCanvas || fabricCanvas.getObjects().length === 0) {
      return false;
    }

    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "transparent";
    applyToolToCanvas(fabricCanvas, activeToolRef.current);
    fabricCanvas.requestRenderAll();
    commitHistory();
    notifySelection();
    return true;
  }, [commitHistory, notifySelection]);

  const exportPng = useCallback((world: StudioWorldSize = DEFAULT_STUDIO_WORLD) => {
    const fabricCanvas = canvasRef.current;

    if (!fabricCanvas) {
      return null;
    }

    const previousBackground = fabricCanvas.backgroundColor;
    const previousViewport = cloneViewportTransform(fabricCanvas.viewportTransform);

    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    const dataUrl = fabricCanvas.toDataURL({
      format: "png",
      height: world.height,
      left: 0,
      multiplier: 1,
      top: 0,
      width: world.width,
    });

    fabricCanvas.backgroundColor = previousBackground;
    fabricCanvas.setViewportTransform(previousViewport);
    fabricCanvas.requestRenderAll();

    return dataUrl;
  }, []);

  const getCanvasJson = useCallback(() => {
    const fabricCanvas = canvasRef.current;

    return fabricCanvas ? serializeCanvas(fabricCanvas) : null;
  }, []);

  const loadCanvasJson = useCallback(
    async (canvasJson: string) => {
      const fabricCanvas = canvasRef.current;

      if (!fabricCanvas) {
        return false;
      }

      const parsedCanvas = JSON.parse(canvasJson) as Record<string, unknown>;
      isRestoringRef.current = true;

      try {
        fabricCanvas.discardActiveObject();
        await fabricCanvas.loadFromJSON(parsedCanvas);
        fabricCanvas.backgroundColor = "transparent";
        applyToolToCanvas(fabricCanvas, activeToolRef.current);
        fabricCanvas.requestRenderAll();
        historyRef.current = {
          redo: [],
          undo: [serializeCanvas(fabricCanvas)],
        };
        syncHistoryState();
        notifySelection();
      } finally {
        isRestoringRef.current = false;
      }

      return true;
    },
    [notifySelection, syncHistoryState],
  );

  const resetCanvas = useCallback(() => {
    const fabricCanvas = canvasRef.current;

    if (!fabricCanvas) {
      return;
    }

    isRestoringRef.current = true;

    try {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "transparent";
      fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      applyToolToCanvas(fabricCanvas, activeToolRef.current);
      fabricCanvas.requestRenderAll();
      historyRef.current = {
        redo: [],
        undo: [serializeCanvas(fabricCanvas)],
      };
      syncHistoryState();
      setZoom(1);
      notifySelection();
    } finally {
      isRestoringRef.current = false;
    }
  }, [notifySelection, syncHistoryState]);

  const resetView = useCallback(() => {
    const fabricCanvas = canvasRef.current;

    if (!fabricCanvas) {
      return;
    }

    fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    fabricCanvas.requestRenderAll();
    setZoom(1);
  }, []);

  const updateObject = useCallback(
    (
      object: FabricObject,
      property: InspectorProperty,
      value: number | string | boolean,
    ) => {
      if (property === "isLocked") {
        const locked = Boolean(value);
        object.set({
          lockMovementX: locked,
          lockMovementY: locked,
          lockRotation: locked,
          lockScalingX: locked,
          lockScalingY: locked,
        });
      } else if (property === "color" && typeof value === "string") {
        if (object instanceof Group) {
          const firstShape = object.getObjects()[0];
          if (firstShape) {
            firstShape.set("fill", value);
          }
        } else {
          object.set("fill", value);
        }
      } else if (typeof value === "number") {
        const safeValue = Number.isFinite(value) ? value : 0;
        if (property === "width") {
          const baseWidth = Math.max(object.width ?? 1, 1);
          object.set({
            scaleX: Math.max(safeValue / baseWidth, 0.05),
          });
        } else if (property === "height") {
          const baseHeight = Math.max(object.height ?? 1, 1);
          object.set({
            scaleY: Math.max(safeValue / baseHeight, 0.05),
          });
        } else if (property === "scaleX" || property === "scaleY") {
          object.set({
            [property]: Math.max(safeValue, 0.05),
          });
        } else {
          object.set({
            [property]: safeValue,
          });
        }
      }

      object.setCoords();
      canvasRef.current?.requestRenderAll();
      commitHistory();
      notifySelection();
    },
    [commitHistory, notifySelection],
  );

  const zoomBy = useCallback((delta: number) => {
    const fabricCanvas = canvasRef.current;

    if (!fabricCanvas) {
      return;
    }

    const nextZoom = clampZoom(fabricCanvas.getZoom() + delta);
    const center = new Point(fabricCanvas.getWidth() / 2, fabricCanvas.getHeight() / 2);

    fabricCanvas.zoomToPoint(center, nextZoom);
    fabricCanvas.requestRenderAll();
    setZoom(nextZoom);
  }, []);

  return {
    canvas,
    canvasContainerRef,
    canvasElementRef,
    canRedo: historyState.canRedo,
    canUndo: historyState.canUndo,
    clearCanvas,
    commitHistory,
    deleteSelected,
    exportPng,
    getCanvasJson,
    loadCanvasJson,
    redo,
    resetCanvas,
    resetView,
    undo,
    updateObject,
    zoom,
    zoomBy,
  };
}
