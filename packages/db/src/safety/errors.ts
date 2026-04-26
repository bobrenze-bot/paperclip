export class MigrationSafetyError extends Error {
  constructor(message: string, public phase: 'pre-flight' | 'execution' | 'post-flight' | 'backup' | 'dry-run') {
    super(message);
    this.name = 'MigrationSafetyError';
  }
}
export class PreFlightError extends MigrationSafetyError {
  constructor(message: string) {
    super(message, 'pre-flight');
    this.name = 'PreFlightError';
  }
}
export interface PreFlightCheckResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string;
}
export interface PreFlightResult {
  success: boolean;
  passedChecks: PreFlightCheckResult[];
  failedChecks: PreFlightCheckResult[];
  errors?: PreFlightError;
}
export interface MigrationResult {
  status: 'success' | 'aborted' | 'failed' | 'dry-run-complete';
  phase?: 'pre-flight' | 'execution' | 'post-flight' | 'backup';
  errors?: MigrationSafetyError[];
  warnings?: string[];
  changes?: MigrationChange[];
}
export interface DryRunResult {
  wouldApply: boolean;
  changes: MigrationChange[];
  estimatedDurationMs: number;
  riskLevel: 'low' | 'medium' | 'high';
  migrationHistory: string[];
}
export interface MigrationChange {
  type: 'create' | 'alter' | 'drop' | 'rename';
  table?: string;
  column?: string;
  details?: string;
}
