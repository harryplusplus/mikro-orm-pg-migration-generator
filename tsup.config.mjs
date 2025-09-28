import { defineConfig } from "tsup";

export default defineConfig({
  format: ["cjs"],
  entry: ["src/index.ts"],
  onSuccess: "tsc",
  swc: true,
  clean: true,
  sourcemap: true,
  keepNames: true,
});
