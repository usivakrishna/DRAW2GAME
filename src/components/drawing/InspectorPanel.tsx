import { useEffect, useState } from "react";
import type { FabricObject } from "fabric";
import { SlidersHorizontal } from "lucide-react";
import { getInspectorValues, type InspectorProperty } from "@/hooks/use-studio-canvas";

interface InspectorPanelProps {
  object: FabricObject | null;
  revision: number;
  onCommit: () => void;
  onUpdate: (property: InspectorProperty, value: number) => void;
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

export function InspectorPanel({ object, revision, onCommit, onUpdate }: InspectorPanelProps) {
  if (!object) {
    return (
      <aside className="border-t border-slate-200 bg-white p-4 lg:border-t-0 lg:border-l">
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
          <SlidersHorizontal aria-hidden="true" className="mx-auto size-5 text-slate-400" />
          <h2 className="mt-3 text-sm font-semibold text-slate-800">Inspector</h2>
          <p className="mt-1.5 text-xs leading-5 text-slate-500">
            Select one object to edit its position, size, rotation, and scale.
          </p>
        </div>
      </aside>
    );
  }

  const values = getInspectorValues(object);

  return (
    <aside className="border-t border-slate-200 bg-white p-4 lg:border-t-0 lg:border-l">
      <div className="flex items-center gap-2">
        <span className="bg-brand-50 text-brand-600 grid size-8 place-items-center rounded-lg">
          <SlidersHorizontal aria-hidden="true" className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Inspector</h2>
          <p className="text-xs text-slate-500">Selected object</p>
        </div>
      </div>

      <dl className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-xs font-medium text-slate-500">Object type</dt>
          <dd className="text-xs font-semibold text-slate-800">{getDisplayType(values.type)}</dd>
        </div>
      </dl>

      <div className="mt-5 grid grid-cols-2 gap-3" key={revision}>
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
      </div>
    </aside>
  );
}
