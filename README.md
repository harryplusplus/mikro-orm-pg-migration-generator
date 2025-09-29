# Mikro ORM PostgreSQL Migration Generator

A MikroORM migration generator extension for automatically managing PostgreSQL `updated_at` column triggers and functions.

## Why?

Unlike MySQL, PostgreSQL does **not** natively support the convenient `ON UPDATE CURRENT_TIMESTAMP` feature for automatically updating timestamp columns. Instead, the typical approach is to use database functions and triggers to achieve this behavior.

While MikroORM provides the `onUpdate: () => new Date()` option for automatically updating columns, this only works within ORM-managed code. For cases where you use query builders or raw SQL, it’s easy to miss handling the `updated_at` logic, leading to verbose and error-prone code.

**This generator automatically creates the necessary migrations for PostgreSQL functions and triggers to keep your `updated_at` columns reliably updated, even outside the ORM.**

## Features

- **Automatic migrations for `updated_at` columns:** Generates PostgreSQL migration scripts for triggers and functions that update your timestamp columns.
- **Custom column names:** Support for columns other than `updated_at`.
- **Custom types:** Works with types other than `timestamptz`.
- **Custom function and trigger names:** Easily configure naming conventions.
- **Up/Down migration scripts:** Automatically create and drop functions/triggers as part of migration.
- **Supports PostgreSQL versions 13 through 17.**

## Installation

```sh
# npm
npm install mikro-orm-pg-migration-generator @mikro-orm/migrations

# pnpm
pnpm add mikro-orm-pg-migration-generator @mikro-orm/migrations
```

## Usage

Configure MikroORM to use the migration generator in your project:

```typescript
import { defineConfig } from "@mikro-orm/postgresql";
import { createMigrationGeneratorClass } from "mikro-orm-pg-migration-generator";

export default defineConfig({
  // With default options
  migrations: { generator: createMigrationGeneratorClass() },

  // Or with customization
  migrations: {
    generator: createMigrationGeneratorClass({
      version: 17, // PostgreSQL parser version
      updatedAt: {
        // Custom column name matcher
        columnNameMatcher: ({ value }) => value.toLowerCase() === "update_date",
        // Custom column type matcher
        columnTypeMatcher: ({ value }) => value.toLowerCase() === "timestamp",
        // Custom function name
        functionNameFactory: (context) => "...",
        // Custom function up SQL
        functionUpSqlFactory: (context) => "...",
        // Custom function down SQL
        functionDownSqlFactory: (context) => "...",
        // Custom trigger name
        triggerNameFactory: (context) => "...",
        // Custom trigger up SQL
        triggerUpSqlFactory: (context) => "...",
        // Custom trigger down SQL
        triggerDownSqlFactory: (context) => "...",
      },
    }),
  },
});
```

### Example: Generated Migration File

When calling `mikro-orm migration:create` for a `users` table with an `updated_at` column, the generated migration might look like:

```typescript
// Migration20250928232237.ts
import { Migration } from "@mikro-orm/migrations";
export class Migration20250928232237 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "users" ( /* ... */ "updated_at" timestamptz not null default current_timestamp, /* ... */ );`
    );
    this
      .addSql(`create or replace function "fn_update_timestamp_users_updated_at"()
returns trigger as $$
begin
  new."updated_at" := current_timestamp;
  return new;
end;
$$ language plpgsql;`);
    this.addSql(`create trigger "tr_update_timestamp_users_updated_at"
before update on "users"
for each row
execute function "fn_update_timestamp_users_updated_at"();`);
  }

  override async down(): Promise<void> {
    this.addSql(
      `drop trigger if exists "tr_update_timestamp_users_updated_at" ON "users";`
    );
    this.addSql(
      `drop function if exists "fn_update_timestamp_users_updated_at"();`
    );
    this.addSql(`drop table if exists "users" cascade;`);
  }
}
```

### Description

When you create a migration using `mikro-orm migration:create` for a table such as `users` with an `updated_at` column, the generator automatically creates the necessary function, and trigger for handling timestamp updates.

The `up` migration creates the trigger function, and trigger to update the timestamp column whenever a row is updated.

The `down` migration safely removes the trigger, and function, ensuring clean rollback.

**This concise example shows how the generator integrates with MikroORM migrations for robust and automatic timestamp logic in your PostgreSQL schema.**

## How to Extend the Migration Generator

To add custom functionality—such as automatically formatting SQL with [**sql-formatter**](https://github.com/sql-formatter-org/sql-formatter)—extend the generator as follows:

```sh
# npm
npm install -D sql-formatter

# pnpm
pnpm add -D sql-formatter
```

```typescript
import { createMigrationGeneratorClass } from "mikro-orm-pg-migration-generator";
import { format } from "sql-formatter";

const BaseMigrationGenerator = createMigrationGeneratorClass();

class CustomMigrationGenerator extends BaseMigrationGenerator {
  override createStatement(sql: string, padLeft: number): string {
    sql = format(sql, { language: "postgresql" });
    sql = `\n${sql}\n`;
    return super.createStatement(sql, padLeft);
  }
}
```

This example demonstrates how to wrap the migration generator and override methods—such as `createStatement`—to incorporate additional logic (e.g., SQL formatting).
You can customize other behaviors the same way, making the generator flexible and easy to extend for advanced migration requirements.

## License

MIT
