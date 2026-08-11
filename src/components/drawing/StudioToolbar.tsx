import type { LucideIcon } from "lucide-react";
import {
  Bug,
  Circle,
  Coins,
  Eraser,
  Flag,
  Hand,
  LineChart,
  MousePointer2,
  Pencil,
  Redo2,
  RectangleHorizontal,
  Square,
  Trash2,
  Triangle,
  Undo2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudioTool } from "@/types/studio";
import { cn } from "@/lib/utils";

interface ToolDefinition {
  icon: LucideIcon;
  label: string;
  tool: StudioTool;
}

interface StudioToolbarProps {
  activeTool: StudioTool;
  canDelete: boolean;
  canRedo: boolean;
  canUndo: boolean;
  onDelete: () => void;
  onRedo: () => void;
  onSelectTool: (tool: StudioTool) => void;
  onUndo: () => void;
}

const drawingTools: ToolDefinition[] = [
  {
    icon: MousePointer2,
    label: "Select",
    tool: "select",
  },
  {
    icon: Hand,
    label: "Pan",
    tool: "pan",
  },
  {
    icon: Pencil,
    label: "Pencil",
    tool: "pencil",
  },
  {
    icon: Eraser,
    label: "Eraser",
    tool: "eraser",
  },
  {
    icon: Square,
    label: "Rectangle",
    tool: "rectangle",
  },
  {
    icon: Circle,
    label: "Circle",
    tool: "circle",
  },
  {
    icon: LineChart,
    label: "Line",
    tool: "line",
  },
];

const gameObjectTools: ToolDefinition[] = [
  {
    icon: UserRound,
    label: "Player",
    tool: "player",
  },
  {
    icon: RectangleHorizontal,
    label: "Platform",
    tool: "platform",
  },
  {
    icon: Bug,
    label: "Enemy",
    tool: "enemy",
  },
  {
    icon: Coins,
    label: "Coin",
    tool: "coin",
  },
  {
    icon: Triangle,
    label: "Spike",
    tool: "spike",
  },
  {
    icon: Flag,
    label: "Goal",
    tool: "goal",
  },
];

function ToolButton({
  activeTool,
  definition,
  onSelectTool,
}: {
  activeTool: StudioTool;
  definition: ToolDefinition;
  onSelectTool: (tool: StudioTool) => void;
}) {
  const Icon = definition.icon;
  const isActive = activeTool === definition.tool;

  return (
    <Button
      aria-label={definition.label}
      aria-pressed={isActive}
      className={cn(
        "h-9 shrink-0 gap-2 px-2.5 lg:h-auto lg:w-full lg:justify-start",
        isActive && "shadow-sm",
      )}
      onClick={() => onSelectTool(definition.tool)}
      size="sm"
      title={definition.label}
      variant={isActive ? "default" : "ghost"}
    >
      <Icon aria-hidden="true" className="size-4" />
      <span className="hidden text-xs lg:inline">{definition.label}</span>
    </Button>
  );
}

export function StudioToolbar({
  activeTool,
  canDelete,
  canRedo,
  canUndo,
  onDelete,
  onRedo,
  onSelectTool,
  onUndo,
}: StudioToolbarProps) {
  return (
    <aside
      aria-label="Drawing tools"
      className="flex w-full shrink-0 flex-row gap-3 overflow-x-auto border-b border-slate-200 bg-white p-2 lg:w-40 lg:flex-col lg:overflow-visible lg:border-r lg:border-b-0"
    >
      <div className="flex shrink-0 gap-1 lg:flex-col">
        <p className="sr-only">Drawing tools</p>
        {drawingTools.map((definition) => (
          <ToolButton
            activeTool={activeTool}
            definition={definition}
            key={definition.tool}
            onSelectTool={onSelectTool}
          />
        ))}
      </div>

      <div className="hidden h-px bg-slate-200 lg:block" />

      <div className="flex shrink-0 gap-1 lg:flex-col">
        <p className="sr-only">Game object tools</p>
        {gameObjectTools.map((definition) => (
          <ToolButton
            activeTool={activeTool}
            definition={definition}
            key={definition.tool}
            onSelectTool={onSelectTool}
          />
        ))}
      </div>

      <div className="hidden h-px bg-slate-200 lg:block" />

      <div className="flex shrink-0 gap-1 lg:flex-col">
        <Button
          aria-label="Delete selected object"
          disabled={!canDelete}
          onClick={onDelete}
          size="sm"
          title="Delete selected object"
          variant="ghost"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          <span className="hidden text-xs lg:inline">Delete</span>
        </Button>
        <Button
          aria-label="Undo"
          disabled={!canUndo}
          onClick={onUndo}
          size="sm"
          title="Undo"
          variant="ghost"
        >
          <Undo2 aria-hidden="true" className="size-4" />
          <span className="hidden text-xs lg:inline">Undo</span>
        </Button>
        <Button
          aria-label="Redo"
          disabled={!canRedo}
          onClick={onRedo}
          size="sm"
          title="Redo"
          variant="ghost"
        >
          <Redo2 aria-hidden="true" className="size-4" />
          <span className="hidden text-xs lg:inline">Redo</span>
        </Button>
      </div>
    </aside>
  );
}
