export class DryRunEngine { async run(db: any) { return {wouldApply: false, changes: [], estimatedDurationMs: 0, riskLevel: "low" as const, migrationHistory: []}; } }
