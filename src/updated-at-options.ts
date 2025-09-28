import type { RequiredDeep, SimplifyDeep } from "type-fest";

export interface MatcherContext {
  value: string;
}

export interface Matcher {
  (context: MatcherContext): boolean;
}

export const DEFAULT_COLUMN_NAME_MATCHER: Matcher = (context) => {
  const { value } = context;
  return value.toLowerCase() === "updated_at";
};

export const DEFAULT_COLUMN_TYPE_MATCHER: Matcher = (context) => {
  const { value } = context;
  return value.toLowerCase() === "timestamptz";
};

export interface NameFactoryContext {
  schemaName: string | null;
  tableName: string;
  columnName: string;
}

export interface NameFactory {
  (context: NameFactoryContext): string;
}

export const DEFAULT_FUNCTION_NAME_FACTORY: NameFactory = (context) => {
  const { tableName, columnName } = context;
  return `fn_update_timestamp_${tableName}_${columnName}`;
};

export interface SqlFactoryContext extends NameFactoryContext {
  functionNameFactory: NameFactory;
  triggerNameFactory: NameFactory;
}

export interface SqlFactory {
  (context: SqlFactoryContext): string;
}

export function doubleQuoted(value: string) {
  return `"${value}"`;
}

export function schemaNamePrefixed(schemaName: string | null) {
  return schemaName ? `${doubleQuoted(schemaName)}.` : "";
}

export const DEFAULT_FUNCTION_UP_SQL_FACTORY: SqlFactory = (context) => {
  const { schemaName, columnName, functionNameFactory } = context;
  return `create or replace function ${schemaNamePrefixed(
    schemaName
  )}${doubleQuoted(functionNameFactory(context))}()
returns trigger as $$
begin
  new.${doubleQuoted(columnName)} := current_timestamp;
  return new;
end;
$$ language plpgsql;`;
};

export const DEFAULT_FUNCTION_DOWN_SQL_FACTORY: SqlFactory = (context) => {
  const { schemaName, functionNameFactory } = context;
  return `drop function if exists ${schemaNamePrefixed(
    schemaName
  )}${doubleQuoted(functionNameFactory(context))}();`;
};

export const DEFAULT_TRIGGER_NAME_FACTORY: NameFactory = (context) => {
  const { tableName, columnName } = context;
  return `tr_update_timestamp_${tableName}_${columnName}`;
};

export const DEFAULT_TRIGGER_UP_SQL_FACTORY: SqlFactory = (context) => {
  const { schemaName, tableName, triggerNameFactory, functionNameFactory } =
    context;
  return `create trigger ${doubleQuoted(triggerNameFactory(context))}
before update on ${schemaNamePrefixed(schemaName)}${doubleQuoted(tableName)}
for each row
execute function ${schemaNamePrefixed(schemaName)}${doubleQuoted(
    functionNameFactory(context)
  )}();`;
};

export const DEFAULT_TRIGGER_DOWN_SQL_FACTORY: SqlFactory = (context) => {
  const { schemaName, tableName, triggerNameFactory } = context;
  return `drop trigger if exists ${doubleQuoted(
    triggerNameFactory(context)
  )} ON ${schemaNamePrefixed(schemaName)}${doubleQuoted(tableName)};`;
};

export interface UpdatedAtOptions {
  columnNameMatcher?: Matcher;
  columnTypeMatcher?: Matcher;
  functionNameFactory?: NameFactory;
  functionUpSqlFactory?: SqlFactory;
  functionDownSqlFactory?: SqlFactory;
  triggerNameFactory?: NameFactory;
  triggerUpSqlFactory?: SqlFactory;
  triggerDownSqlFactory?: SqlFactory;
}

export type ParsedUpdatedAtOptions = SimplifyDeep<
  RequiredDeep<UpdatedAtOptions>
>;

export function parseUpdatedAtOptions(
  options?: UpdatedAtOptions
): ParsedUpdatedAtOptions {
  const {
    columnNameMatcher = DEFAULT_COLUMN_NAME_MATCHER,
    columnTypeMatcher = DEFAULT_COLUMN_TYPE_MATCHER,
    functionNameFactory = DEFAULT_FUNCTION_NAME_FACTORY,
    functionUpSqlFactory = DEFAULT_FUNCTION_UP_SQL_FACTORY,
    functionDownSqlFactory = DEFAULT_FUNCTION_DOWN_SQL_FACTORY,
    triggerNameFactory = DEFAULT_TRIGGER_NAME_FACTORY,
    triggerUpSqlFactory = DEFAULT_TRIGGER_UP_SQL_FACTORY,
    triggerDownSqlFactory = DEFAULT_TRIGGER_DOWN_SQL_FACTORY,
  } = options ?? {};

  return {
    columnNameMatcher,
    columnTypeMatcher,
    functionNameFactory,
    functionUpSqlFactory,
    functionDownSqlFactory,
    triggerNameFactory,
    triggerUpSqlFactory,
    triggerDownSqlFactory,
  };
}
