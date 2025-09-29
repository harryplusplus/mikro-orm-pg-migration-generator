import type { MigrationDiff } from "@mikro-orm/core";
import { Parser, type SupportedVersion } from "@pgsql/parser";
import { EmptySqlProcessor } from "./empty-sql-processor";
import { type Options, type ParsedOptions, parseOptions } from "./options";
import { UpdatedAtProcessor } from "./updated-at-processor";

export interface HandlerContext {
  options: ParsedOptions;
  parser: Parser<SupportedVersion>;
}

export class Handler {
  private readonly context: HandlerContext;

  constructor(options?: Options) {
    const parsedOptions = parseOptions(options);
    const parser = new Parser<SupportedVersion>({
      version: parsedOptions.version,
    });
    this.context = { options: parsedOptions, parser };
  }

  async onGenerate(): Promise<void> {
    await this.context.parser.loadParser();
  }

  onGenerateMigrationFile(diff: MigrationDiff): void {
    new EmptySqlProcessor().process(diff);
    new UpdatedAtProcessor(this.context).process(diff);
  }
}
