import type { MigrationDiff } from "@mikro-orm/core";

export class EmptySqlProcessor {
  process(diff: MigrationDiff) {
    diff.up = diff.up.filter((x) => x.length > 0);
    diff.down = diff.down.filter((x) => x.length > 0);
  }
}
