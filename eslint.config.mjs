import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"
import { FlatCompat } from "@eslint/eslintrc"

const require = createRequire(import.meta.url)
const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  resolvePluginsRelativeTo: dirname(require.resolve("eslint-config-next/package.json")),
})

const config = [
  { ignores: [".next/**", ".next-review/**", "node_modules/**", ".claude/**", ".gstack/**", "test-results/**", "playwright-report/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals"),
]

export default config
