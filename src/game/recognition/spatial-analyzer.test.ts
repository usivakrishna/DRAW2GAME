import { describe, expect, it } from "vitest";
import type { DetectionPrediction } from "@/types/detection";
import { SpatialAnalyzer } from "./spatial-analyzer";

describe("SpatialAnalyzer", () => {
  it("correctly identifies above and below spatial relationships", () => {
    const player: DetectionPrediction = {
      boundingBox: { height: 48, width: 32, x: 100, y: 100 },
      className: "player",
      confidence: 0.9,
      id: "player_1",
    };
    const platform: DetectionPrediction = {
      boundingBox: { height: 32, width: 120, x: 80, y: 150 },
      className: "platform",
      confidence: 0.95,
      id: "platform_1",
    };

    const rels = SpatialAnalyzer.analyzeRelationships([player, platform]);

    const aboveRel = rels.find(
      (r) => r.subjectId === "player_1" && r.targetId === "platform_1" && r.relation === "above",
    );
    expect(aboveRel).toBeDefined();
    expect(aboveRel!.confidence).toBeGreaterThanOrEqual(0.8);

    const belowRel = rels.find(
      (r) => r.subjectId === "platform_1" && r.targetId === "player_1" && r.relation === "below",
    );
    expect(belowRel).toBeDefined();
  });

  it("correctly identifies leftOf and rightOf relationships", () => {
    const coin1: DetectionPrediction = {
      boundingBox: { height: 20, width: 20, x: 50, y: 200 },
      className: "coin",
      confidence: 0.85,
      id: "coin_1",
    };
    const coin2: DetectionPrediction = {
      boundingBox: { height: 20, width: 20, x: 150, y: 200 },
      className: "coin",
      confidence: 0.85,
      id: "coin_2",
    };

    const rels = SpatialAnalyzer.analyzeRelationships([coin1, coin2]);

    const leftRel = rels.find(
      (r) => r.subjectId === "coin_1" && r.targetId === "coin_2" && r.relation === "leftOf",
    );
    expect(leftRel).toBeDefined();

    const rightRel = rels.find(
      (r) => r.subjectId === "coin_2" && r.targetId === "coin_1" && r.relation === "rightOf",
    );
    expect(rightRel).toBeDefined();
  });

  it("detects overlaps and containment", () => {
    const parentBox: DetectionPrediction = {
      boundingBox: { height: 100, width: 100, x: 50, y: 50 },
      className: "platform",
      confidence: 0.9,
      id: "box_parent",
    };
    const childBox: DetectionPrediction = {
      boundingBox: { height: 20, width: 20, x: 70, y: 70 },
      className: "coin",
      confidence: 0.95,
      id: "box_child",
    };

    const rels = SpatialAnalyzer.analyzeRelationships([parentBox, childBox]);

    const containsRel = rels.find(
      (r) => r.subjectId === "box_parent" && r.targetId === "box_child" && r.relation === "contains",
    );
    expect(containsRel).toBeDefined();

    const overlapRel = rels.find(
      (r) => r.subjectId === "box_parent" && r.targetId === "box_child" && r.relation === "overlaps",
    );
    expect(overlapRel).toBeDefined();
    expect(overlapRel!.overlapRatio).toBe(1.0);
  });

  it("detects horizontal and vertical alignment", () => {
    const p1: DetectionPrediction = {
      boundingBox: { height: 30, width: 100, x: 50, y: 300 },
      className: "platform",
      confidence: 0.9,
      id: "p1",
    };
    const p2: DetectionPrediction = {
      boundingBox: { height: 30, width: 100, x: 200, y: 300 },
      className: "platform",
      confidence: 0.9,
      id: "p2",
    };

    const rels = SpatialAnalyzer.analyzeRelationships([p1, p2]);
    const horizAlign = rels.find(
      (r) => r.subjectId === "p1" && r.targetId === "p2" && r.relation === "alignedWithHorizontal",
    );
    expect(horizAlign).toBeDefined();
  });

  it("detects near and far proximity", () => {
    const nearA: DetectionPrediction = {
      boundingBox: { height: 20, width: 20, x: 100, y: 100 },
      className: "coin",
      confidence: 0.8,
      id: "near_a",
    };
    const nearB: DetectionPrediction = {
      boundingBox: { height: 20, width: 20, x: 130, y: 100 },
      className: "coin",
      confidence: 0.8,
      id: "near_b",
    };
    const farC: DetectionPrediction = {
      boundingBox: { height: 20, width: 20, x: 800, y: 800 },
      className: "goal",
      confidence: 0.9,
      id: "far_c",
    };

    const rels = SpatialAnalyzer.analyzeRelationships([nearA, nearB, farC]);

    const nearRel = rels.find(
      (r) => r.subjectId === "near_a" && r.targetId === "near_b" && r.relation === "near",
    );
    expect(nearRel).toBeDefined();

    const farRel = rels.find(
      (r) => r.subjectId === "near_a" && r.targetId === "far_c" && r.relation === "far",
    );
    expect(farRel).toBeDefined();
  });

  it("groups objects into rows, columns, and repeated instances", () => {
    const coins: DetectionPrediction[] = [
      { boundingBox: { height: 20, width: 20, x: 50, y: 100 }, className: "coin", confidence: 0.9, id: "c1" },
      { boundingBox: { height: 20, width: 20, x: 100, y: 100 }, className: "coin", confidence: 0.9, id: "c2" },
      { boundingBox: { height: 20, width: 20, x: 150, y: 100 }, className: "coin", confidence: 0.9, id: "c3" },
    ];

    const groups = SpatialAnalyzer.findGroups(coins);

    const repeatedGroup = groups.find((g) => g.type === "repeated" && g.properties?.entityClass === "coin");
    expect(repeatedGroup).toBeDefined();
    expect(repeatedGroup!.objectIds.length).toBe(3);

    const rowGroup = groups.find((g) => g.type === "row");
    expect(rowGroup).toBeDefined();
    expect(rowGroup!.objectIds.length).toBe(3);
  });

  it("classifies side-scroller layout from platforms, player, and aspect ratio", () => {
    const objects: DetectionPrediction[] = [
      { boundingBox: { height: 48, width: 32, x: 80, y: 300 }, className: "player", confidence: 0.9, id: "p" },
      { boundingBox: { height: 32, width: 200, x: 50, y: 350 }, className: "platform", confidence: 0.9, id: "plat1" },
      { boundingBox: { height: 32, width: 200, x: 300, y: 350 }, className: "platform", confidence: 0.9, id: "plat2" },
      { boundingBox: { height: 64, width: 44, x: 550, y: 280 }, className: "goal", confidence: 0.9, id: "g" },
    ];

    const rels = SpatialAnalyzer.analyzeRelationships(objects);
    const groups = SpatialAnalyzer.findGroups(objects);
    const layout = SpatialAnalyzer.classifyLayout(objects, rels, groups, { height: 600, width: 1000 });

    expect(layout.type).toBe("side-scroller");
    expect(layout.confidence).toBeGreaterThanOrEqual(0.7);
    expect(layout.evidence.length).toBeGreaterThan(0);
  });
});
