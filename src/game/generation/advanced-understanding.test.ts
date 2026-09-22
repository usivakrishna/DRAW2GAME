/**
 * DRAW2GAME — Phase 16: Advanced Sketch Understanding & Generation Tests
 *
 * Validates:
 * 1. Detection geometry produces bounding-box and center/size metadata.
 * 2. Spatial analyzer correctly identifies above/below.
 * 3. Spatial analyzer correctly identifies left/right.
 * 4. Overlap detection works.
 * 5. Object grouping works for valid geometry (rows, columns, grids, repeated).
 * 6. Recognition consumes detection evidence.
 * 7. Low-confidence recognition remains honestly low-confidence without faking.
 * 8. GameUnderstanding contains objects.
 * 9. GameUnderstanding contains spatial relationships.
 * 10. GameUnderstanding contains interactions when supported.
 * 11. Capability inference works.
 * 12. Rule inference produces declarative rules.
 * 13. UniversalGameGenerator consumes the richer understanding.
 * 14. Invalid understanding produces diagnostics.
 * 15. Confidence propagates correctly throughout the pipeline.
 * 16. Manual game selection overrides uncertain recognition without faking model confidence.
 * 17. Platformer generation passes with inferred capabilities and rules.
 * 18. Chess generation passes with inferred capabilities and rules.
 */

import { describe, expect, it } from "vitest";
import { GameRecognizer } from "@/game/recognition/game-recognizer";
import { RuleInferer } from "@/game/recognition/rule-inferer";
import { SpatialAnalyzer } from "@/game/recognition/spatial-analyzer";
import {
  type DetectionPrediction,
  normalizeDetectionPrediction,
} from "@/types/detection";
import { GameUnderstandingExtractor } from "./game-understanding";
import { UniversalGameGenerator } from "./universal-game-generator";
import { UnderstandingValidator } from "./validators/understanding-validator";

describe("Phase 16 — Advanced Sketch Understanding & Generation", () => {
  // 1. Detection geometry produces bounding-box metadata
  it("1. normalizes detection prediction to compute center point and size", () => {
    const raw: DetectionPrediction = {
      boundingBox: { height: 40, width: 60, x: 100, y: 200 },
      className: "platform",
      confidence: 0.88,
      id: "plat_1",
    };
    const norm = normalizeDetectionPrediction(raw, "model");

    expect(norm.center).toEqual({ x: 130, y: 220 });
    expect(norm.size).toEqual({ height: 40, width: 60 });
    expect(norm.category).toBe("platform");
    expect(norm.source).toBe("model");
  });

  // 2. Spatial analyzer correctly identifies above/below
  it("2. spatial analyzer correctly identifies above and below", () => {
    const p: DetectionPrediction = {
      boundingBox: { height: 48, width: 32, x: 100, y: 50 },
      className: "player",
      confidence: 0.9,
      id: "p1",
    };
    const ground: DetectionPrediction = {
      boundingBox: { height: 32, width: 200, x: 50, y: 120 },
      className: "platform",
      confidence: 0.95,
      id: "plat1",
    };

    const rels = SpatialAnalyzer.analyzeRelationships([p, ground]);
    const aboveRel = rels.find(
      (r) => r.subjectId === "p1" && r.targetId === "plat1" && r.relation === "above",
    );
    expect(aboveRel).toBeDefined();
    expect(aboveRel!.confidence).toBeGreaterThanOrEqual(0.8);

    const belowRel = rels.find(
      (r) => r.subjectId === "plat1" && r.targetId === "p1" && r.relation === "below",
    );
    expect(belowRel).toBeDefined();
  });

  // 3. Spatial analyzer correctly identifies left/right
  it("3. spatial analyzer correctly identifies leftOf and rightOf", () => {
    const leftBox: DetectionPrediction = {
      boundingBox: { height: 30, width: 30, x: 50, y: 200 },
      className: "coin",
      confidence: 0.9,
      id: "c1",
    };
    const rightBox: DetectionPrediction = {
      boundingBox: { height: 30, width: 30, x: 150, y: 200 },
      className: "coin",
      confidence: 0.9,
      id: "c2",
    };

    const rels = SpatialAnalyzer.analyzeRelationships([leftBox, rightBox]);
    expect(rels.some((r) => r.subjectId === "c1" && r.targetId === "c2" && r.relation === "leftOf")).toBe(true);
    expect(rels.some((r) => r.subjectId === "c2" && r.targetId === "c1" && r.relation === "rightOf")).toBe(true);
  });

  // 4. Overlap detection works
  it("4. detects spatial overlap and calculates overlap ratio", () => {
    const parent: DetectionPrediction = {
      boundingBox: { height: 100, width: 100, x: 0, y: 0 },
      className: "platform",
      confidence: 0.9,
      id: "box1",
    };
    const child: DetectionPrediction = {
      boundingBox: { height: 50, width: 50, x: 25, y: 25 },
      className: "coin",
      confidence: 0.9,
      id: "box2",
    };

    const rels = SpatialAnalyzer.analyzeRelationships([parent, child]);
    const overlap = rels.find((r) => r.subjectId === "box1" && r.targetId === "box2" && r.relation === "overlaps");
    expect(overlap).toBeDefined();
    expect(overlap!.overlapRatio).toBe(1.0);
  });

  // 5. Object grouping works for valid geometry
  it("5. groups objects into horizontal rows and repeated classes", () => {
    const platforms: DetectionPrediction[] = [
      { boundingBox: { height: 32, width: 100, x: 50, y: 300 }, className: "platform", confidence: 0.9, id: "p1" },
      { boundingBox: { height: 32, width: 100, x: 180, y: 300 }, className: "platform", confidence: 0.9, id: "p2" },
      { boundingBox: { height: 32, width: 100, x: 310, y: 300 }, className: "platform", confidence: 0.9, id: "p3" },
    ];

    const groups = SpatialAnalyzer.findGroups(platforms);
    const rowGroup = groups.find((g) => g.type === "row");
    expect(rowGroup).toBeDefined();
    expect(rowGroup!.objectIds.length).toBe(3);

    const repeatedGroup = groups.find((g) => g.type === "repeated");
    expect(repeatedGroup).toBeDefined();
  });

  // 6. Recognition consumes detection evidence
  it("6. recognition consumes detection predictions and spatial evidence", () => {
    const preds: DetectionPrediction[] = [
      { boundingBox: { height: 48, width: 32, x: 80, y: 300 }, className: "player", confidence: 0.9, id: "p" },
      { boundingBox: { height: 32, width: 300, x: 50, y: 350 }, className: "platform", confidence: 0.9, id: "plat1" },
      { boundingBox: { height: 32, width: 200, x: 400, y: 220 }, className: "platform", confidence: 0.9, id: "plat2" },
      { boundingBox: { height: 64, width: 44, x: 550, y: 156 }, className: "goal", confidence: 0.9, id: "g" },
    ];

    const result = GameRecognizer.recognize({ predictions: preds });
    expect(result.gameType).toBe("platformer");
    expect(result.confidence).toBeGreaterThanOrEqual(0.6);
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.capabilities).toContain("physics");
    expect(result.capabilities).toContain("movement");
  });

  // 7. Low-confidence recognition remains honestly low-confidence
  it("7. low-confidence recognition remains honest without fake scores", () => {
    // Blank or non-genre shapes
    const preds: DetectionPrediction[] = [
      { boundingBox: { height: 10, width: 10, x: 50, y: 50 }, className: "coin", confidence: 0.3, id: "c_vague" },
    ];

    const result = GameRecognizer.recognize({ predictions: preds });
    expect(result.gameType).toBe("unknown");
    expect(result.confidence).toBeLessThanOrEqual(0.4);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  // 8. GameUnderstanding contains objects
  it("8. GameUnderstanding extracts and contains objects with coordinates and roles", () => {
    const input = {
      predictions: [
        { boundingBox: { height: 48, width: 32, x: 96, y: 384 }, className: "player" as const, confidence: 0.9, id: "p1" },
        { boundingBox: { height: 32, width: 200, x: 50, y: 500 }, className: "platform" as const, confidence: 0.9, id: "plat1" },
      ],
      projectId: "proj_test_8",
      source: "detection" as const,
    };

    const understanding = GameUnderstandingExtractor.extract(input);
    expect(understanding.objects.length).toBe(2);
    expect(understanding.objects[0]!.role).toBe("player");
    expect(understanding.objects[1]!.role).toBe("platform");
  });

  // 9. GameUnderstanding contains relationships
  it("9. GameUnderstanding extracts spatial relationships", () => {
    const input = {
      predictions: [
        { boundingBox: { height: 48, width: 32, x: 96, y: 100 }, className: "player" as const, confidence: 0.9, id: "p1" },
        { boundingBox: { height: 32, width: 200, x: 50, y: 200 }, className: "platform" as const, confidence: 0.9, id: "plat1" },
      ],
      projectId: "proj_test_9",
      source: "detection" as const,
    };

    const understanding = GameUnderstandingExtractor.extract(input);
    expect(understanding.relationships.length).toBeGreaterThan(0);
    const above = understanding.relationships.find((r) => r.relation === "above");
    expect(above).toBeDefined();
  });

  // 10. GameUnderstanding contains interactions when supported
  it("10. GameUnderstanding infers gameplay interactions", () => {
    const input = {
      predictions: [
        { boundingBox: { height: 48, width: 32, x: 96, y: 100 }, className: "player" as const, confidence: 0.9, id: "p1" },
        { boundingBox: { height: 32, width: 200, x: 50, y: 200 }, className: "platform" as const, confidence: 0.9, id: "plat1" },
        { boundingBox: { height: 24, width: 24, x: 150, y: 160 }, className: "coin" as const, confidence: 0.85, id: "c1" },
        { boundingBox: { height: 64, width: 44, x: 220, y: 140 }, className: "goal" as const, confidence: 0.9, id: "g1" },
      ],
      projectId: "proj_test_10",
      source: "detection" as const,
    };

    const understanding = GameUnderstandingExtractor.extract(input);
    expect(understanding.interactions.length).toBeGreaterThan(0);
    expect(understanding.interactions.some((i) => i.verb === "collidesWith")).toBe(true);
    expect(understanding.interactions.some((i) => i.verb === "collects")).toBe(true);
    expect(understanding.interactions.some((i) => i.verb === "reaches")).toBe(true);
  });

  // 11. Capability inference works
  it("11. capability inference correctly maps game understanding to runtime capabilities", () => {
    const input = {
      predictions: [
        { boundingBox: { height: 48, width: 32, x: 96, y: 100 }, className: "player" as const, confidence: 0.9, id: "p1" },
        { boundingBox: { height: 32, width: 200, x: 50, y: 200 }, className: "platform" as const, confidence: 0.9, id: "plat1" },
        { boundingBox: { height: 20, width: 20, x: 120, y: 150 }, className: "coin" as const, confidence: 0.85, id: "c1" },
      ],
      projectId: "proj_test_11",
      source: "detection" as const,
      targetGameType: "platformer" as const,
    };

    const understanding = GameUnderstandingExtractor.extract(input);
    expect(understanding.capabilities).toContain("physics");
    expect(understanding.capabilities).toContain("movement");
    expect(understanding.capabilities).toContain("collision");
    expect(understanding.capabilities).toContain("collectibles");
    expect(understanding.capabilities).toContain("scoring");
    expect(understanding.capabilities).toContain("rules");
  });

  // 12. Rule inference produces declarative rules
  it("12. rule inference derives declarative rules without executing runtime logic", () => {
    const rules = RuleInferer.inferRules(
      "platformer",
      [
        { confidence: 0.9, evidence: "Goal reachable", id: "int_reach", source: "test", subjectId: "p", targetId: "g", verb: "reaches" },
        { confidence: 0.9, evidence: "Coin collectible", id: "int_coin", source: "test", subjectId: "p", targetId: "c", verb: "collects" },
      ],
      { bounds: { height: 600, width: 800, x: 0, y: 0 }, confidence: 0.9, evidence: [], groups: [], type: "side-scroller" },
    );

    expect(rules.some((r) => r.category === "win")).toBe(true);
    expect(rules.some((r) => r.category === "loss")).toBe(true);
    expect(rules.some((r) => r.category === "scoring")).toBe(true);
    expect(rules.some((r) => r.category === "movement")).toBe(true);
  });

  // 13. UniversalGameGenerator consumes the richer understanding
  it("13. UniversalGameGenerator consumes richer understanding and sets definition capabilities and rules", () => {
    const res = UniversalGameGenerator.generateGame({
      options: { synthesizeDefaults: true },
      predictions: [
        { boundingBox: { height: 48, width: 32, x: 80, y: 300 }, className: "player", confidence: 0.9, id: "p1" },
        { boundingBox: { height: 32, width: 300, x: 50, y: 400 }, className: "platform", confidence: 0.9, id: "plat1" },
        { boundingBox: { height: 64, width: 44, x: 400, y: 336 }, className: "goal", confidence: 0.9, id: "g1" },
      ],
      projectId: "proj_test_13",
      source: "detection",
      targetGameType: "platformer",
    });

    expect(res.success).toBe(true);
    expect(res.gameDefinition).not.toBeNull();
    expect(res.gameDefinition!.capabilities).toContain("physics");
    expect(res.gameDefinition!.capabilities).toContain("movement");
    expect(res.gameDefinition!.capabilities).toContain("collision");
    expect(res.gameDefinition!.capabilities).toContain("rules");
    expect(res.gameDefinition!.rules.length).toBeGreaterThan(0);
  });

  // 14. Invalid understanding produces diagnostics
  it("14. understanding validator catches invalid references and impossible geometry", () => {
    const invalidUnderstanding = {
      capabilities: ["physics" as const, "rules" as const],
      confidence: 0.8,
      gameType: "platformer" as const,
      interactions: [
        {
          confidence: 0.9,
          evidence: "Missing subject",
          id: "int_bad",
          source: "test",
          subjectId: "non_existent_subject",
          verb: "moves" as const,
        },
      ],
      layout: { bounds: { height: 100, width: 100, x: 0, y: 0 }, confidence: 0.8, evidence: [], groups: [], type: "freeform" as const },
      objectCandidates: [
        { height: -20, id: "broken_box", role: "platform", width: 0, x: 10, y: 10 },
      ],
      objects: [
        { height: -20, id: "broken_box", role: "platform", width: 0, x: 10, y: 10 },
      ],
      relationships: [
        {
          confidence: 0.9,
          id: "rel_bad",
          relation: "above" as const,
          subjectId: "broken_box",
          targetId: "non_existent_target",
        },
      ],
      ruleCandidates: [],
      rules: [],
    };

    const val = UnderstandingValidator.validate(invalidUnderstanding);
    expect(val.isValid).toBe(false);
    expect(val.errors.some((e) => e.includes("impossible"))).toBe(true);
    expect(val.errors.some((e) => e.includes("non-existent"))).toBe(true);
    expect(val.diagnostics.length).toBeGreaterThan(0);
  });

  // 15. Confidence propagates correctly
  it("15. confidence propagates through understanding without false certainty", () => {
    const lowPred: DetectionPrediction = {
      boundingBox: { height: 30, width: 30, x: 50, y: 50 },
      className: "coin",
      confidence: 0.42,
      id: "c_low",
    };

    const understanding = GameUnderstandingExtractor.extract({
      predictions: [lowPred],
      projectId: "proj_test_15",
      source: "detection",
    });

    expect(understanding.confidence).toBeLessThan(0.5);
    expect(understanding.objects[0]!.confidence).toBe(0.42);
  });

  // 16. Manual game selection overrides uncertain recognition without faking model confidence
  it("16. manual override sets target game type cleanly with user source tracking", () => {
    const understanding = GameUnderstandingExtractor.extract({
      predictions: [],
      projectId: "proj_test_16",
      source: "manual",
      targetGameType: "chess",
    });

    expect(understanding.gameType).toBe("chess");
    expect(understanding.confidence).toBe(1.0);
    expect(understanding.sourceTracking?.["gameType"]).toBe("user");
    expect(understanding.capabilities).toContain("board");
    expect(understanding.capabilities).toContain("turns");
  });

  // 17. Platformer regression passes
  it("17. generates a valid playable platformer through UniversalGameGenerator", () => {
    const res = UniversalGameGenerator.generateGame({
      options: { synthesizeDefaults: true },
      predictions: [
        { boundingBox: { height: 48, width: 32, x: 96, y: 384 }, className: "player", confidence: 0.95, id: "player" },
        { boundingBox: { height: 32, width: 600, x: 50, y: 550 }, className: "platform", confidence: 0.95, id: "ground" },
        { boundingBox: { height: 64, width: 44, x: 600, y: 486 }, className: "goal", confidence: 0.95, id: "goal" },
      ],
      projectId: "proj_platformer_regression",
      source: "detection",
      targetGameType: "platformer",
    });

    expect(res.success).toBe(true);
    expect(res.gameDefinition).not.toBeNull();
    expect(res.gameDefinition!.gameType).toBe("platformer");
    expect(res.gameDefinition!.objects.some((o) => o.type === "player")).toBe(true);
    expect(res.gameDefinition!.objects.some((o) => o.type === "platform")).toBe(true);
    expect(res.gameDefinition!.objects.some((o) => o.type === "goal")).toBe(true);
  });

  // 18. Chess regression passes
  it("18. generates a valid playable chess game definition through UniversalGameGenerator", () => {
    const res = UniversalGameGenerator.generateGame({
      projectId: "proj_chess_regression",
      source: "manual",
      targetGameType: "chess",
    });

    expect(res.success).toBe(true);
    expect(res.gameDefinition).not.toBeNull();
    expect(res.gameDefinition!.gameType).toBe("chess");
    expect(res.gameDefinition!.capabilities).toEqual(
      expect.arrayContaining(["board", "grid", "turns", "rules", "scoring"]),
    );
    expect(res.gameDefinition!.objects.length).toBe(32);
  });
});
