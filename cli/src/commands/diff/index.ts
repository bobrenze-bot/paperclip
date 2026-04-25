import { Command } from "commander";
import {diffImportPackages} from "./import-diff.js";

export function registerDiffCommands(program: Command): void {
  const diff = program.command("diff").description("Package comparison utilities");

  diff
    .command("packages")
    .description("Compare two import packages for overlap and drift")
    .requiredOption("--left <path>", "Path to left package directory")
    .requiredOption("--right <path>", "Path to right package directory")
    .action(async (opts) => {
      await diffImportPackages(opts);
    });
}
