import type { MigrationDiff } from "@mikro-orm/core";

export class EmptySqlFilter {
  constructor(private readonly diff: MigrationDiff) {}

  filter() {
    this.diff.up = this.diff.up.filter((x) => x.length > 0);
    this.diff.down = this.diff.down.filter((x) => x.length > 0);
  }
}
