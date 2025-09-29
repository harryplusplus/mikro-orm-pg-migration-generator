import type { MigrationDiff } from "@mikro-orm/core";
import type { ColumnDef, CreateStmt } from "@pgsql/parser";
import { walk } from "@pgsql/traverse";
import type { HandlerContext } from "./handler";
import type { SqlFactoryContext } from "./updated-at-options";

export interface UpdatedAtInfo {
  schemaName: string | null;
  tableName: string;
  columnNames: string[];
}

export class UpdatedAtProcessor {
  private readonly updatedAtInfos: UpdatedAtInfo[] = [];

  constructor(private readonly handlerContext: HandlerContext) {}

  process(diff: MigrationDiff) {
    diff.up.forEach((sql) => this.parseUp(sql));

    const { updatedAt } = this.handlerContext.options;
    this.updatedAtInfos.forEach(({ schemaName, tableName, columnNames }) => {
      columnNames.forEach((columnName) => {
        const sqlFactoryContext: SqlFactoryContext = {
          ...updatedAt,
          schemaName,
          tableName,
          columnName,
        };
        diff.up.push(updatedAt.functionUpSqlFactory(sqlFactoryContext));
        diff.up.push(updatedAt.triggerUpSqlFactory(sqlFactoryContext));
        diff.down.unshift(updatedAt.triggerDownSqlFactory(sqlFactoryContext));
        diff.down.unshift(updatedAt.functionDownSqlFactory(sqlFactoryContext));
      });
    });
  }

  private parseUp(sql: string) {
    const { stmts } = this.handlerContext.parser.parseSync(sql);
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
    const { columnNameMatcher, columnTypeMatcher } =
      this.handlerContext.options.updatedAt;

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
