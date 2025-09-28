import type { SupportedVersion } from "@pgsql/parser";
import type { RequiredDeep, SimplifyDeep } from "type-fest";
import {
  parseUpdatedAtOptions,
  type UpdatedAtOptions,
} from "./updated-at-options";

export interface Options {
  version?: SupportedVersion;
  updatedAt?: UpdatedAtOptions;
}

export type ParsedOptions = SimplifyDeep<RequiredDeep<Options>>;

export function parseOptions(options?: Options): ParsedOptions {
  const { version = 17, updatedAt } = options ?? {};
  return {
    version,
    updatedAt: parseUpdatedAtOptions(updatedAt),
  };
}
