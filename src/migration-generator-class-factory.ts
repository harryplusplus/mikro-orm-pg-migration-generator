import type {
  MigrationDiff,
  MigrationsOptions,
  NamingStrategy,
} from "@mikro-orm/core";
import type { AbstractSqlDriver } from "@mikro-orm/knex";
import { TSMigrationGenerator } from "@mikro-orm/migrations";
import { Interceptor } from "./interceptor";
import type { Options } from "./options";

export class MigrationGeneratorClassFactory {
  constructor(private readonly options?: Options) {}

  create() {
    const factoryOptions = this.options;

    class MigrationGeneratorFacade extends TSMigrationGenerator {
      readonly interceptor = new Interceptor(factoryOptions);

      constructor(
        override readonly driver: AbstractSqlDriver,
        override readonly namingStrategy: NamingStrategy,
        override readonly options: MigrationsOptions
      ) {
        super(driver, namingStrategy, options);
      }

      override async generate(
        diff: MigrationDiff,
        path?: string,
        name?: string
      ): Promise<[string, string]> {
        return await this.interceptor.generate({ diff, path, name }, (input) =>
          super.generate(input.diff, input.path, input.name)
        );
      }

      override createStatement(sql: string, padLeft: number): string {
        return this.interceptor.createStatement({ sql, padLeft }, (input) =>
          super.createStatement(input.sql, input.padLeft)
        );
      }

      override generateMigrationFile(
        className: string,
        diff: MigrationDiff
      ): string {
        return this.interceptor.generateMigrationFile(
          { className, diff },
          (input) => super.generateMigrationFile(input.className, input.diff)
        );
      }
    }

    return MigrationGeneratorFacade;
  }
}

export function createMigrationGeneratorClass(options?: Options) {
  return new MigrationGeneratorClassFactory(options).create();
}
