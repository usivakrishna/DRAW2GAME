/**
 * DRAW2GAME — Phase 16: Advanced Sketch Understanding & Generation
 * Spatial Relationship Analyzer & Object Grouping Engine
 *
 * Derives pure geometric and topological relationships from detected entities:
 * - Directional: above, below, leftOf, rightOf
 * - Topological: overlaps, contains, connectedTo
 * - Alignment: alignedWithHorizontal, alignedWithVertical
 * - Proximity: near, far
 * - Grouping: rows, columns, grids, clusters, repetitions
 * - Layout: side-scroller, grid-board, arena, freeform
 */

import {
  type DetectionBoundingBox,
  type DetectionPrediction,
  normalizeDetectionPrediction,
} from "@/types/detection";
import type {
  LayoutStructure,
  ObjectGroup,
  SpatialRelationship,
} from "./spatial-types";

function computeBounds(boxes: DetectionBoundingBox[]): DetectionBoundingBox {
  if (boxes.length === 0) {
    return { height: 0, width: 0, x: 0, y: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const b of boxes) {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }

  return {
    height: Math.max(0, maxY - minY),
    width: Math.max(0, maxX - minX),
    x: minX,
    y: minY,
  };
}

export class SpatialAnalyzer {
  /**
   * Analyzes pairwise geometric relationships between all detected objects.
   */
  public static analyzeRelationships(
    rawDetections: DetectionPrediction[],
  ): SpatialRelationship[] {
    const detections = rawDetections.map((d) => normalizeDetectionPrediction(d));
    const relationships: SpatialRelationship[] = [];

    for (let i = 0; i < detections.length; i++) {
      const a = detections[i]!;
      const aBox = a.boundingBox;
      const aCenter = a.center!;

      for (let j = 0; j < detections.length; j++) {
        if (i === j) continue;
        const b = detections[j]!;
        const bBox = b.boundingBox;
        const bCenter = b.center!;

        const dx = bCenter.x - aCenter.x;
        const dy = bCenter.y - aCenter.y;
        const centerDist = Math.hypot(dx, dy);

        // 1. Containment (A contains B)
        if (
          aBox.x <= bBox.x &&
          aBox.y <= bBox.y &&
          aBox.x + aBox.width >= bBox.x + bBox.width &&
          aBox.y + aBox.height >= bBox.y + bBox.height
        ) {
          relationships.push({
            confidence: 1.0,
            distance: centerDist,
            id: `rel_${a.id}_contains_${b.id}`,
            relation: "contains",
            subjectId: a.id,
            targetId: b.id,
          });
        }

        // 2. Overlap & Connectedness
        const interLeft = Math.max(aBox.x, bBox.x);
        const interTop = Math.max(aBox.y, bBox.y);
        const interRight = Math.min(aBox.x + aBox.width, bBox.x + bBox.width);
        const interBottom = Math.min(aBox.y + aBox.height, bBox.y + bBox.height);

        const interWidth = Math.max(0, interRight - interLeft);
        const interHeight = Math.max(0, interBottom - interTop);
        const interArea = interWidth * interHeight;

        if (interArea > 0) {
          const aArea = aBox.width * aBox.height;
          const bArea = bBox.width * bBox.height;
          const minArea = Math.min(aArea, bArea);
          const overlapRatio = minArea > 0 ? interArea / minArea : 0;

          relationships.push({
            confidence: Math.min(1.0, 0.7 + overlapRatio * 0.3),
            distance: centerDist,
            id: `rel_${a.id}_overlaps_${b.id}`,
            overlapRatio,
            relation: "overlaps",
            subjectId: a.id,
            targetId: b.id,
          });
        } else {
          // Check if touching / connected (gap <= 4px along shared boundary)
          const horizOverlap = interWidth > 0 || (aBox.x < bBox.x + bBox.width && aBox.x + aBox.width > bBox.x);
          const vertOverlap = interHeight > 0 || (aBox.y < bBox.y + bBox.height && aBox.y + aBox.height > bBox.y);

          const vertGap = Math.max(0, Math.max(aBox.y - (bBox.y + bBox.height), bBox.y - (aBox.y + aBox.height)));
          const horizGap = Math.max(0, Math.max(aBox.x - (bBox.x + bBox.width), bBox.x - (aBox.x + aBox.width)));

          if ((horizOverlap && vertGap <= 6) || (vertOverlap && horizGap <= 6)) {
            relationships.push({
              confidence: 0.9,
              distance: centerDist,
              id: `rel_${a.id}_connectedTo_${b.id}`,
              relation: "connectedTo",
              subjectId: a.id,
              targetId: b.id,
            });
          }
        }

        // 3. Directional: Above / Below
        // A is above B if bottom of A is near or above top of B, and vertically higher
        const aBottom = aBox.y + aBox.height;
        const bTop = bBox.y;
        const hasHorizontalOverlap = aBox.x < bBox.x + bBox.width && aBox.x + aBox.width > bBox.x;

        if (aBottom <= bTop + 16 && aCenter.y < bCenter.y) {
          const confidence = hasHorizontalOverlap ? 0.95 : 0.8;
          relationships.push({
            confidence,
            distance: bTop - aBottom,
            id: `rel_${a.id}_above_${b.id}`,
            relation: "above",
            subjectId: a.id,
            targetId: b.id,
          });
        } else if (aBox.y >= bBox.y + bBox.height - 16 && aCenter.y > bCenter.y) {
          const confidence = hasHorizontalOverlap ? 0.95 : 0.8;
          relationships.push({
            confidence,
            distance: aBox.y - (bBox.y + bBox.height),
            id: `rel_${a.id}_below_${b.id}`,
            relation: "below",
            subjectId: a.id,
            targetId: b.id,
          });
        }

        // 4. Directional: LeftOf / RightOf
        const aRight = aBox.x + aBox.width;
        const bLeft = bBox.x;
        const hasVerticalOverlap = aBox.y < bBox.y + bBox.height && aBox.y + aBox.height > bBox.y;

        if (aRight <= bLeft + 16 && aCenter.x < bCenter.x) {
          const confidence = hasVerticalOverlap ? 0.95 : 0.8;
          relationships.push({
            confidence,
            distance: bLeft - aRight,
            id: `rel_${a.id}_leftOf_${b.id}`,
            relation: "leftOf",
            subjectId: a.id,
            targetId: b.id,
          });
        } else if (aBox.x >= bBox.x + bBox.width - 16 && aCenter.x > bCenter.x) {
          const confidence = hasVerticalOverlap ? 0.95 : 0.8;
          relationships.push({
            confidence,
            distance: aBox.x - (bBox.x + bBox.width),
            id: `rel_${a.id}_rightOf_${b.id}`,
            relation: "rightOf",
            subjectId: a.id,
            targetId: b.id,
          });
        }

        // 5. Alignment: Horizontal & Vertical
        if (Math.abs(aCenter.y - bCenter.y) <= 15 || Math.abs(aBottom - (bBox.y + bBox.height)) <= 12) {
          relationships.push({
            confidence: 0.85,
            distance: Math.abs(aCenter.y - bCenter.y),
            id: `rel_${a.id}_alignedHoriz_${b.id}`,
            relation: "alignedWithHorizontal",
            subjectId: a.id,
            targetId: b.id,
          });
        }

        if (Math.abs(aCenter.x - bCenter.x) <= 15) {
          relationships.push({
            confidence: 0.85,
            distance: Math.abs(aCenter.x - bCenter.x),
            id: `rel_${a.id}_alignedVert_${b.id}`,
            relation: "alignedWithVertical",
            subjectId: a.id,
            targetId: b.id,
          });
        }

        // 6. Proximity: Near vs Far
        if (centerDist <= 120) {
          relationships.push({
            confidence: Math.max(0.6, 1.0 - centerDist / 120),
            distance: centerDist,
            id: `rel_${a.id}_near_${b.id}`,
            relation: "near",
            subjectId: a.id,
            targetId: b.id,
          });
        } else if (centerDist >= 400) {
          relationships.push({
            confidence: Math.min(0.95, centerDist / 800),
            distance: centerDist,
            id: `rel_${a.id}_far_${b.id}`,
            relation: "far",
            subjectId: a.id,
            targetId: b.id,
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Identifies structural groupings among detected objects.
   */
  public static findGroups(
    rawDetections: DetectionPrediction[],
  ): ObjectGroup[] {
    const detections = rawDetections.map((d) => normalizeDetectionPrediction(d));
    if (detections.length < 2) return [];

    const groups: ObjectGroup[] = [];

    // 1. Repeated entity groupings (same class with >= 2 instances)
    const classMap = new Map<string, DetectionPrediction[]>();
    for (const d of detections) {
      const cls = d.category || d.className;
      if (!classMap.has(cls)) classMap.set(cls, []);
      classMap.get(cls)!.push(d);
    }

    for (const [cls, items] of classMap.entries()) {
      if (items.length >= 2) {
        groups.push({
          bounds: computeBounds(items.map((i) => i.boundingBox)),
          id: `group_repeated_${cls}_${items.length}`,
          objectIds: items.map((i) => i.id),
          properties: { count: items.length, entityClass: cls },
          type: "repeated",
        });
      }
    }

    // 2. Horizontal Rows (aligned centers within 24px and distinct X positions)
    const sortedByY = [...detections].sort((a, b) => a.center!.y - b.center!.y);
    const rowClusters: DetectionPrediction[][] = [];

    for (const item of sortedByY) {
      let added = false;
      for (const cluster of rowClusters) {
        const avgY = cluster.reduce((sum, el) => sum + el.center!.y, 0) / cluster.length;
        if (Math.abs(item.center!.y - avgY) <= 24) {
          cluster.push(item);
          added = true;
          break;
        }
      }
      if (!added) {
        rowClusters.push([item]);
      }
    }

    for (const row of rowClusters) {
      if (row.length >= 2) {
        // Sort from left to right
        row.sort((a, b) => a.center!.x - b.center!.x);
        groups.push({
          bounds: computeBounds(row.map((i) => i.boundingBox)),
          id: `group_row_${groups.length + 1}`,
          objectIds: row.map((i) => i.id),
          properties: { count: row.length, direction: "horizontal" },
          type: "row",
        });
      }
    }

    // 3. Vertical Columns (aligned centers within 24px and distinct Y positions)
    const sortedByX = [...detections].sort((a, b) => a.center!.x - b.center!.x);
    const colClusters: DetectionPrediction[][] = [];

    for (const item of sortedByX) {
      let added = false;
      for (const cluster of colClusters) {
        const avgX = cluster.reduce((sum, el) => sum + el.center!.x, 0) / cluster.length;
        if (Math.abs(item.center!.x - avgX) <= 24) {
          cluster.push(item);
          added = true;
          break;
        }
      }
      if (!added) {
        colClusters.push([item]);
      }
    }

    for (const col of colClusters) {
      if (col.length >= 2) {
        col.sort((a, b) => a.center!.y - b.center!.y);
        groups.push({
          bounds: computeBounds(col.map((i) => i.boundingBox)),
          id: `group_col_${groups.length + 1}`,
          objectIds: col.map((i) => i.id),
          properties: { count: col.length, direction: "vertical" },
          type: "column",
        });
      }
    }

    // 4. Grid structures (cross between >=2 rows and >=2 columns)
    const validRows = groups.filter((g) => g.type === "row");
    const validCols = groups.filter((g) => g.type === "column");
    if (validRows.length >= 2 && validCols.length >= 2) {
      const gridObjectIds = new Set<string>();
      validRows.forEach((r) => r.objectIds.forEach((id) => gridObjectIds.add(id)));
      validCols.forEach((c) => c.objectIds.forEach((id) => gridObjectIds.add(id)));

      if (gridObjectIds.size >= 4) {
        const gridItems = detections.filter((d) => gridObjectIds.has(d.id));
        groups.push({
          bounds: computeBounds(gridItems.map((i) => i.boundingBox)),
          id: `group_grid_${groups.length + 1}`,
          objectIds: Array.from(gridObjectIds),
          properties: {
            columnsCount: validCols.length,
            rowsCount: validRows.length,
            totalCells: gridObjectIds.size,
          },
          type: "grid",
        });
      }
    }

    return groups;
  }

  /**
   * Classifies the holistic layout of the detected elements.
   */
  public static classifyLayout(
    rawDetections: DetectionPrediction[],
    relationships: SpatialRelationship[],
    groups: ObjectGroup[],
    sourceDimensions?: { height: number; width: number } | undefined,
  ): LayoutStructure {
    const detections = rawDetections.map((d) => normalizeDetectionPrediction(d));
    const bounds = computeBounds(detections.map((d) => d.boundingBox));
    const evidence: string[] = [];

    if (detections.length === 0) {
      return {
        bounds,
        confidence: 0,
        evidence: ["No objects available for layout analysis"],
        groups: [],
        type: "unknown",
      };
    }

    // Check for Grid-Board
    const hasGridGroup = groups.some((g) => g.type === "grid");
    const gridPieces = detections.filter(
      (d) =>
        d.className.startsWith("chess") ||
        (d.category && d.category.startsWith("chess")),
    );

    if (hasGridGroup || gridPieces.length >= 4) {
      evidence.push("Detected regular grid matrix / discrete board cells");
      if (gridPieces.length > 0) {
        evidence.push(`Found ${gridPieces.length} board game piece candidates`);
      }
      return {
        bounds,
        confidence: Math.min(0.95, 0.6 + gridPieces.length * 0.05),
        evidence,
        groups,
        type: "grid-board",
      };
    }

    // Check for Side-Scroller (Platformer)
    const platformDetections = detections.filter(
      (d) => d.className === "platform" || d.category === "platform",
    );
    const hasPlayer = detections.some((d) => d.className === "player" || d.category === "player");
    const hasGoal = detections.some((d) => d.className === "goal" || d.category === "goal");
    const hasAboveRelations = relationships.some(
      (r) => r.relation === "above" && r.confidence >= 0.8,
    );

    const aspectRatio = bounds.height > 0 ? bounds.width / bounds.height : 1;
    const isWide = aspectRatio >= 1.4 || (sourceDimensions && sourceDimensions.width / sourceDimensions.height >= 1.3);

    if (platformDetections.length > 0 || (hasPlayer && hasAboveRelations)) {
      if (platformDetections.length > 0) {
        evidence.push(`Detected ${platformDetections.length} platform support structures`);
      }
      if (hasPlayer) {
        evidence.push("Player spawn detected with vertical gravity arrangement");
      }
      if (hasGoal) {
        evidence.push("Goal target detected on level boundary");
      }
      if (isWide) {
        evidence.push(`Horizontal traversal layout (aspect ratio ${aspectRatio.toFixed(2)})`);
      }

      let confidence = 0.5;
      if (platformDetections.length > 0) confidence += 0.25;
      if (hasPlayer) confidence += 0.15;
      if (hasGoal) confidence += 0.1;

      return {
        bounds,
        confidence: Math.min(0.95, confidence),
        evidence,
        groups,
        type: "side-scroller",
      };
    }

    // Freeform fallback
    evidence.push("Objects positioned without strict grid or side-scrolling baseline");
    return {
      bounds,
      confidence: 0.4,
      evidence,
      groups,
      type: "freeform",
    };
  }
}
