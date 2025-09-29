import type {
  MigrationDiff,
  MigrationsOptions,
  NamingStrategy,
} from "@mikro-orm/core";
import type { AbstractSqlDriver } from "@mikro-orm/knex";
import { TSMigrationGenerator } from "@mikro-orm/migrations";
import { Handler } from "./handler";
import type { Options } from "./options";

export class MigrationGeneratorClassFactory {
  constructor(private readonly options?: Options) {}

  create() {
    const factoryOptions = this.options;

    class MigrationGeneratorFacade extends TSMigrationGenerator {
      readonly handler: Handler;

      constructor(
        override readonly driver: AbstractSqlDriver,
        override readonly namingStrategy: NamingStrategy,
        override readonly options: MigrationsOptions
      ) {
        super(driver, namingStrategy, options);
        this.handler = new Handler(factoryOptions);
      }

      override async generate(
        diff: MigrationDiff,
        path?: string,
        name?: string
      ): Promise<[string, string]> {
        await this.handler.onGenerate();
        return await super.generate(diff, path, name);
      }

      override generateMigrationFile(
        className: string,
        diff: MigrationDiff
      ): string {
        this.handler.onGenerateMigrationFile(diff);
        return super.generateMigrationFile(className, diff);
      }
    }

    return MigrationGeneratorFacade;
  }
}

export function createMigrationGeneratorClass(options?: Options) {
  return new MigrationGeneratorClassFactory(options).create();
}
