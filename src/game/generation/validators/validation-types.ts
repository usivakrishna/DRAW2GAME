/**
 * DRAW2GAME — Phase 13: Universal Game Generation Architecture
 * Validation Types
 */

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  code: string;
  entityId?: string | undefined;
  message: string;
  path?: string | undefined;
  severity: ValidationSeverity;
}

export interface ValidationResult {
  errors: string[];
  isValid: boolean;
  issues: ValidationIssue[];
  warnings: string[];
}
