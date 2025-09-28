import type {
  MigrationDiff,
  MigrationsOptions,
  NamingStrategy,
} from "@mikro-orm/core";
import { AbstractSqlDriver } from "@mikro-orm/knex";
import { TSMigrationGenerator } from "@mikro-orm/migrations";
import { GenerateMigrationFileProcessor } from "./generate-migration-file-processor";
import type { Options } from "./options";

export class MigrationGeneratorClassFactory {
  constructor(private readonly options?: Options) {}

  create() {
    const factoryOptions = this.options;

    class MigrationGeneratorFacade extends TSMigrationGenerator {
      constructor(
        override readonly driver: AbstractSqlDriver,
        override readonly namingStrategy: NamingStrategy,
        override readonly options: MigrationsOptions
      ) {
        super(driver, namingStrategy, options);
      }

      override generateMigrationFile(
        className: string,
        diff: MigrationDiff
      ): string {
        const processor = new GenerateMigrationFileProcessor(factoryOptions);
        processor.process(diff);
        return super.generateMigrationFile(className, diff);
      }
    }

    return MigrationGeneratorFacade;
  }
}

export function createMigrationGeneratorClass(options?: Options) {
  return new MigrationGeneratorClassFactory(options).create();
}
