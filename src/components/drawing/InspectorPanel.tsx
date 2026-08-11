import { useEffect, useState } from "react";
import type { FabricObject } from "fabric";
import { Lock, LockOpen, SlidersHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInspectorValues, type InspectorProperty } from "@/hooks/use-studio-canvas";

interface InspectorPanelProps {
  object: FabricObject | null;
  onCommit: () => void;
  onDelete?: () => void;
  onUpdate: (property: InspectorProperty, value: number | string | boolean) => void;
  revision: number;
}

interface NumberFieldProps {
  label: string;
  min?: number;
  onCommit: () => void;
  onUpdate: (value: number) => void;
  step?: number;
  value: number;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function NumberField({ label, min, onCommit, onUpdate, step = 1, value }: NumberFieldProps) {
  const [draftValue, setDraftValue] = useState(() => formatNumber(value));

  useEffect(() => {
    setDraftValue(formatNumber(value));
  }, [value]);

  const applyValue = (nextValue: string) => {
    const parsedValue = Number(nextValue);

    if (Number.isFinite(parsedValue)) {
      onUpdate(parsedValue);
    }
  };

  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        className="focus:border-brand-500 focus:ring-brand-100 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-950 shadow-sm transition outline-none focus:ring-2"
        min={min}
        onBlur={() => {
          const parsedValue = Number(draftValue);

          if (Number.isFinite(parsedValue)) {
            onUpdate(parsedValue);
          } else {
            setDraftValue(formatNumber(value));
          }

          onCommit();
        }}
        onChange={(event) => {
          setDraftValue(event.target.value);
          applyValue(event.target.value);
        }}
        step={step}
        type="number"
        value={draftValue}
      />
    </label>
  );
}

function getDisplayType(type: string) {
  return type.replace(/-/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function InspectorPanel({
  object,
  onCommit,
  onDelete,
  onUpdate,
  revision,
}: InspectorPanelProps) {
  if (!object) {
    return (
      <aside className="border-t border-slate-200 bg-white p-4 lg:border-t-0 lg:border-l">
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
          <SlidersHorizontal aria-hidden="true" className="mx-auto size-5 text-slate-400" />
          <h2 className="mt-3 text-sm font-semibold text-slate-800">Inspector</h2>
          <p className="mt-1.5 text-xs leading-5 text-slate-500">
            Select one object to edit its position, size, rotation, scale, lock, and color.
          </p>
        </div>
      </aside>
    );
  }

  const values = getInspectorValues(object);

  return (
    <aside className="flex flex-col border-t border-slate-200 bg-white p-4 lg:border-t-0 lg:border-l">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-brand-50 text-brand-600 grid size-8 place-items-center rounded-lg">
            <SlidersHorizontal aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Inspector</h2>
            <p className="text-xs text-slate-500">Selected object</p>
          </div>
        </div>

        <Button
          aria-label={values.isLocked ? "Unlock object" : "Lock object"}
          className="h-8 gap-1 px-2 text-xs"
          onClick={() => {
            onUpdate("isLocked", !values.isLocked);
            onCommit();
          }}
          size="sm"
          title={values.isLocked ? "Unlock object" : "Lock object"}
          variant={values.isLocked ? "default" : "outline"}
        >
          {values.isLocked ? (
            <>
              <Lock aria-hidden="true" className="size-3.5" /> Locked
            </>
          ) : (
            <>
              <LockOpen aria-hidden="true" className="size-3.5" /> Lock
            </>
          )}
        </Button>
      </div>

      <dl className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-xs font-medium text-slate-500">Object type</dt>
          <dd className="text-xs font-semibold text-slate-800">{getDisplayType(values.type)}</dd>
        </div>
      </dl>

      <div className="mt-4 grid grid-cols-2 gap-3" key={revision}>
        <NumberField
          label="X position"
          onCommit={onCommit}
          onUpdate={(value) => onUpdate("left", value)}
          value={values.left}
        />
        <NumberField
          label="Y position"
          onCommit={onCommit}
          onUpdate={(value) => onUpdate("top", value)}
          value={values.top}
        />
        <NumberField
          label="Width"
          min={4}
          onCommit={onCommit}
          onUpdate={(value) => onUpdate("width", value)}
          value={values.width}
        />
        <NumberField
          label="Height"
          min={4}
          onCommit={onCommit}
          onUpdate={(value) => onUpdate("height", value)}
          value={values.height}
        />
        <NumberField
          label="Rotation"
          onCommit={onCommit}
          onUpdate={(value) => onUpdate("angle", value)}
          value={values.angle}
        />
        <NumberField
          label="Scale X"
          min={0.05}
          onCommit={onCommit}
          onUpdate={(value) => onUpdate("scaleX", value)}
          step={0.05}
          value={values.scaleX}
        />
        <NumberField
          label="Scale Y"
          min={0.05}
          onCommit={onCommit}
          onUpdate={(value) => onUpdate("scaleY", value)}
          step={0.05}
          value={values.scaleY}
        />

        <label className="col-span-2 grid gap-1.5">
          <span className="text-xs font-medium text-slate-600">Color</span>
          <div className="flex items-center gap-2">
            <input
              className="size-9 shrink-0 cursor-pointer rounded-md border border-slate-300 p-0.5"
              onChange={(e) => {
                onUpdate("color", e.target.value);
                onCommit();
              }}
              type="color"
              value={values.color.startsWith("#") ? values.color : "#2563eb"}
            />
            <input
              className="focus:border-brand-500 focus:ring-brand-100 h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 font-mono text-sm text-slate-950 shadow-sm transition outline-none focus:ring-2 uppercase"
              onChange={(e) => {
                onUpdate("color", e.target.value);
              }}
              onBlur={onCommit}
              type="text"
              value={values.color}
            />
          </div>
        </label>
      </div>

      {onDelete && (
        <div className="mt-auto pt-5">
          <Button
            className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={onDelete}
            size="sm"
            variant="ghost"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Delete Object
          </Button>
        </div>
      )}
    </aside>
  );
}
