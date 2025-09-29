import type { MigrationDiff } from "@mikro-orm/core";
import { Parser, type SupportedVersion } from "@pgsql/parser";
import { EmptySqlFilter } from "./empty-sql-filter";
import { type FilledOptions, fillOptions, type Options } from "./options";
import { UpdatedAtProcessor } from "./updated-at-processor";

export interface InterceptorContext {
  options: FilledOptions;
  parser: Parser<SupportedVersion>;
}

export interface GenerateInput {
  diff: MigrationDiff;
  path: string | undefined;
  name: string | undefined;
}

export type GenerateOutput = [string, string];

export interface CreateStatementInput {
  sql: string;
  padLeft: number;
}

export type CreateStatementOutput = string;

export interface GenerateMigrationFileInput {
  className: string;
  diff: MigrationDiff;
}

export type GenerateMigrationFileOutput = string;

export class Interceptor {
  private readonly context: InterceptorContext;

  constructor(options?: Options) {
    const filledOptions = fillOptions(options);
    const parser = new Parser<SupportedVersion>({
      version: filledOptions.version,
    });
    this.context = { options: filledOptions, parser };
  }

  async generate(
    input: GenerateInput,
    next: (input: GenerateInput) => Promise<GenerateOutput>
  ): Promise<GenerateOutput> {
    await this.context.parser.loadParser();
    return await next(input);
  }

  createStatement(
    input: CreateStatementInput,
    next: (input: CreateStatementInput) => CreateStatementOutput
  ): CreateStatementOutput {
    return next(input);
  }

  generateMigrationFile(
    input: GenerateMigrationFileInput,
    next: (input: GenerateMigrationFileInput) => GenerateMigrationFileOutput
  ): GenerateMigrationFileOutput {
    new EmptySqlFilter(input.diff).filter();
    new UpdatedAtProcessor(this.context, input.diff).process();
    return next(input);
  }
}
