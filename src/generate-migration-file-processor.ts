import type { MigrationDiff } from "@mikro-orm/core";
import {
  Parser,
  type ColumnDef,
  type CreateStmt,
  type SupportedVersion,
} from "@pgsql/parser";
import { walk } from "@pgsql/traverse";
import { parseOptions, type Options, type ParsedOptions } from "./options";
import type { SqlFactoryContext } from "./updated-at-options";

export interface UpdatedAtInfo {
  schemaName: string | null;
  tableName: string;
  columnNames: string[];
}

export class GenerateMigrationFileProcessor {
  private readonly options: ParsedOptions;
  private readonly parser: Parser<SupportedVersion>;
  private readonly updatedAtInfos: UpdatedAtInfo[] = [];

  constructor(options?: Options) {
    this.options = parseOptions(options);
    this.parser = new Parser<SupportedVersion>({
      version: this.options.version,
    });
  }

  async process(diff: MigrationDiff) {
    await this.parser.loadParser();

    diff.up.forEach((sql) => this.parseUp(sql));

    const { updatedAt } = this.options;
    this.updatedAtInfos.forEach(({ schemaName, tableName, columnNames }) => {
      columnNames.forEach((columnName) => {
        const context: SqlFactoryContext = {
          ...updatedAt,
          schemaName,
          tableName,
          columnName,
        };
        diff.up.push(updatedAt.functionUpSqlFactory(context));
        diff.up.push(updatedAt.triggerUpSqlFactory(context));
        diff.down.unshift(updatedAt.triggerDownSqlFactory(context));
        diff.down.unshift(updatedAt.functionDownSqlFactory(context));
      });
    });
  }

  private parseUp(sql: string) {
    const { stmts } = this.parser.parseSync(sql);
    if (!stmts) return;

    stmts.forEach((stmt) => {
      if (!stmt.stmt) return;

      walk(stmt.stmt, (path) => {
        if (path.tag !== "CreateStmt") return false;

        return this.parseCreateStmt(path.node as CreateStmt);
      });
    });
  }

  private parseCreateStmt(createStmt: CreateStmt): false | undefined {
    const schemaName = createStmt.relation?.schemaname ?? null;
    const tableName = createStmt.relation?.relname;
    if (!tableName) return false;

    if (!createStmt.tableElts) return false;

    const columnNames = createStmt.tableElts
      .map((columnNode) => {
        if (!("ColumnDef" in columnNode)) return;

        return this.parseColumnDef(columnNode.ColumnDef);
      })
      .filter((x): x is string => !!x);

    this.updatedAtInfos.push({ schemaName, tableName, columnNames });
    return;
  }

  private parseColumnDef(columnDef: ColumnDef): string | undefined {
    const { columnNameMatcher, columnTypeMatcher } = this.options.updatedAt;

    const columnName = columnDef.colname;
    if (!columnName) return;
    if (!columnNameMatcher({ value: columnName })) return;

    const typeNode = columnDef.typeName?.names?.[0];
    if (!typeNode) return;
    if (!("String" in typeNode)) return;

    const columnType = typeNode.String.sval;
    if (!columnType) return;
    if (!columnTypeMatcher({ value: columnType })) return;

    return columnName;
  }
}
