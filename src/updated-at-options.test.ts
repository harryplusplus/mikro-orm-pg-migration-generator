import {
  DEFAULT_COLUMN_NAME_MATCHER,
  DEFAULT_COLUMN_TYPE_MATCHER,
  DEFAULT_FUNCTION_DOWN_SQL_FACTORY,
  DEFAULT_FUNCTION_NAME_FACTORY,
  DEFAULT_FUNCTION_UP_SQL_FACTORY,
  DEFAULT_TRIGGER_DOWN_SQL_FACTORY,
  DEFAULT_TRIGGER_NAME_FACTORY,
  DEFAULT_TRIGGER_UP_SQL_FACTORY,
  doubleQuoted,
  schemaNamePrefixed,
} from "./updated-at-options";

describe("DEFAULT_COLUMN_NAME_MATCHER", () => {
  test("match", () => {
    expect(DEFAULT_COLUMN_NAME_MATCHER({ value: "updated_at" })).toBe(true);
  });

  test("match uppercase", () => {
    expect(DEFAULT_COLUMN_NAME_MATCHER({ value: "UPDATED_AT" })).toBe(true);
  });

  test("not match", () => {
    expect(DEFAULT_COLUMN_NAME_MATCHER({ value: "updatedAt" })).toBe(false);
  });
});

describe("DEFAULT_COLUMN_TYPE_MATCHER", () => {
  test("match", () => {
    expect(DEFAULT_COLUMN_TYPE_MATCHER({ value: "timestamptz" })).toBe(true);
  });

  test("match uppercase", () => {
    expect(DEFAULT_COLUMN_TYPE_MATCHER({ value: "TIMESTAMPTZ" })).toBe(true);
  });

  test("not match", () => {
    expect(DEFAULT_COLUMN_TYPE_MATCHER({ value: "timestamp" })).toBe(false);
  });
});

describe("doubleQuoted", () => {
  test("create", () => {
    expect(doubleQuoted("a")).toBe(`"a"`);
  });
});

describe("schemaNamePrefixed", () => {
  test("null", () => {
    expect(schemaNamePrefixed(null)).toBe("");
  });

  test("exists", () => {
    expect(schemaNamePrefixed("a")).toBe(`"a".`);
  });
});

describe("DEFAULT_FUNCTION_NAME_FACTORY", () => {
  test("schema null", () => {
    expect(
      DEFAULT_FUNCTION_NAME_FACTORY({
        schemaName: null,
        tableName: "t",
        columnName: "c",
      })
    ).toBe("fn_update_timestamp_t_c");
  });

  test("schema exists", () => {
    expect(
      DEFAULT_FUNCTION_NAME_FACTORY({
        schemaName: "s",
        tableName: "t",
        columnName: "c",
      })
    ).toBe("fn_update_timestamp_t_c");
  });
});

describe("DEFAULT_TRIGGER_NAME_FACTORY", () => {
  test("schema null", () => {
    expect(
      DEFAULT_TRIGGER_NAME_FACTORY({
        schemaName: null,
        tableName: "t",
        columnName: "c",
      })
    ).toBe("tr_update_timestamp_t_c");
  });

  test("schema exists", () => {
    expect(
      DEFAULT_TRIGGER_NAME_FACTORY({
        schemaName: "s",
        tableName: "t",
        columnName: "c",
      })
    ).toBe("tr_update_timestamp_t_c");
  });
});

describe("DEFAULT_FUNCTION_UP_SQL_FACTORY", () => {
  test("schema null", () => {
    expect(
      DEFAULT_FUNCTION_UP_SQL_FACTORY({
        schemaName: null,
        tableName: "users",
        columnName: "updated_at",
        functionNameFactory: DEFAULT_FUNCTION_NAME_FACTORY,
        triggerNameFactory: DEFAULT_TRIGGER_NAME_FACTORY,
      })
    ).toBe(`create or replace function "fn_update_timestamp_users_updated_at"()
returns trigger as $$
begin
  new."updated_at" := current_timestamp;
  return new;
end;
$$ language plpgsql;`);
  });

  test("schema exists", () => {
    expect(
      DEFAULT_FUNCTION_UP_SQL_FACTORY({
        schemaName: "s",
        tableName: "t",
        columnName: "c",
        functionNameFactory: DEFAULT_FUNCTION_NAME_FACTORY,
        triggerNameFactory: DEFAULT_TRIGGER_NAME_FACTORY,
      })
    ).toBe(`create or replace function "s"."fn_update_timestamp_t_c"()
returns trigger as $$
begin
  new."c" := current_timestamp;
  return new;
end;
$$ language plpgsql;`);
  });
});

describe("DEFAULT_FUNCTION_DOWN_SQL_FACTORY", () => {
  test("schema null", () => {
    expect(
      DEFAULT_FUNCTION_DOWN_SQL_FACTORY({
        schemaName: null,
        tableName: "users",
        columnName: "updated_at",
        functionNameFactory: DEFAULT_FUNCTION_NAME_FACTORY,
        triggerNameFactory: DEFAULT_TRIGGER_NAME_FACTORY,
      })
    ).toBe(`drop function if exists "fn_update_timestamp_users_updated_at"();`);
  });

  test("schema exists", () => {
    expect(
      DEFAULT_FUNCTION_DOWN_SQL_FACTORY({
        schemaName: "s",
        tableName: "t",
        columnName: "c",
        functionNameFactory: DEFAULT_FUNCTION_NAME_FACTORY,
        triggerNameFactory: DEFAULT_TRIGGER_NAME_FACTORY,
      })
    ).toBe(`drop function if exists "s"."fn_update_timestamp_t_c"();`);
  });
});

describe("DEFAULT_TRIGGER_UP_SQL_FACTORY", () => {
  test("schema null", () => {
    expect(
      DEFAULT_TRIGGER_UP_SQL_FACTORY({
        schemaName: null,
        tableName: "users",
        columnName: "updated_at",
        functionNameFactory: DEFAULT_FUNCTION_NAME_FACTORY,
        triggerNameFactory: DEFAULT_TRIGGER_NAME_FACTORY,
      })
    ).toBe(`create trigger "tr_update_timestamp_users_updated_at"
before update on "users"
for each row
execute function "fn_update_timestamp_users_updated_at"();`);
  });

  test("schema exists", () => {
    expect(
      DEFAULT_TRIGGER_UP_SQL_FACTORY({
        schemaName: "s",
        tableName: "t",
        columnName: "c",
        functionNameFactory: DEFAULT_FUNCTION_NAME_FACTORY,
        triggerNameFactory: DEFAULT_TRIGGER_NAME_FACTORY,
      })
    ).toBe(`create trigger "tr_update_timestamp_t_c"
before update on "s"."t"
for each row
execute function "s"."fn_update_timestamp_t_c"();`);
  });
});

describe("DEFAULT_TRIGGER_DOWN_SQL_FACTORY", () => {
  test("schema null", () => {
    expect(
      DEFAULT_TRIGGER_DOWN_SQL_FACTORY({
        schemaName: null,
        tableName: "users",
        columnName: "updated_at",
        functionNameFactory: DEFAULT_FUNCTION_NAME_FACTORY,
        triggerNameFactory: DEFAULT_TRIGGER_NAME_FACTORY,
      })
    ).toBe(
      `drop trigger if exists "tr_update_timestamp_users_updated_at" ON "users";`
    );
  });

  test("schema exists", () => {
    expect(
      DEFAULT_TRIGGER_DOWN_SQL_FACTORY({
        schemaName: "s",
        tableName: "t",
        columnName: "c",
        functionNameFactory: DEFAULT_FUNCTION_NAME_FACTORY,
        triggerNameFactory: DEFAULT_TRIGGER_NAME_FACTORY,
      })
    ).toBe(`drop trigger if exists "tr_update_timestamp_t_c" ON "s"."t";`);
  });
});
