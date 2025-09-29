import type { MigrationDiff } from "@mikro-orm/core";
import type { ColumnDef, CreateStmt } from "@pgsql/parser";
import { walk } from "@pgsql/traverse";
import type { InterceptorContext } from "./interceptor";
import type { SqlFactoryContext } from "./updated-at-options";

export interface UpdatedAtInfo {
  schemaName: string | null;
  tableName: string;
  columnNames: string[];
}

export class UpdatedAtProcessor {
  private readonly updatedAtInfos: UpdatedAtInfo[] = [];

  constructor(
    private readonly interceptorContext: InterceptorContext,
    private readonly diff: MigrationDiff
  ) {}

  process() {
    this.collectUpdatedAtInfos();

    const { updatedAt } = this.interceptorContext.options;
    this.updatedAtInfos.forEach(({ schemaName, tableName, columnNames }) => {
      columnNames.forEach((columnName) => {
        const sqlFactoryContext: SqlFactoryContext = {
          ...updatedAt,
          schemaName,
          tableName,
          columnName,
        };

        const { up, down } = this.diff;
        up.push(updatedAt.functionUpSqlFactory(sqlFactoryContext));
        down.unshift(updatedAt.functionDownSqlFactory(sqlFactoryContext));

        up.push(updatedAt.triggerUpSqlFactory(sqlFactoryContext));
        down.unshift(updatedAt.triggerDownSqlFactory(sqlFactoryContext));
      });
    });
  }

  private collectUpdatedAtInfos() {
    this.diff.up.forEach((sql) => this.parseUp(sql));
  }

  private parseUp(sql: string) {
    const { stmts } = this.interceptorContext.parser.parseSync(sql);
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
      this.interceptorContext.options.updatedAt;

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
