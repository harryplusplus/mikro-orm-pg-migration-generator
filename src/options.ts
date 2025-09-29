import type { SupportedVersion } from "@pgsql/parser";
import type { RequiredDeep, SimplifyDeep } from "type-fest";
import {
  fillUpdatedAtOptions,
  type UpdatedAtOptions,
} from "./updated-at-options";

export interface Options {
  version?: SupportedVersion;
  updatedAt?: UpdatedAtOptions;
}

export type FilledOptions = SimplifyDeep<RequiredDeep<Options>>;

export function fillOptions(options?: Options): FilledOptions {
  const { version = 17, updatedAt } = options ?? {};
  return {
    version,
    updatedAt: fillUpdatedAtOptions(updatedAt),
  };
}
