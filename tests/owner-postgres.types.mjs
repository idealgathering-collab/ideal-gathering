// Generate from the disposable schema only; never overwrite application types.
// node tests/owner-postgres.types.mjs <absolute verification runtime directory>
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const runtime = resolve(process.argv[2]);
const require = createRequire(resolve(runtime, "package.json"));
const { Client } = require("pg");
const { introspect } = await import(
  pathToFileURL(require.resolve("@supabase/postgrest-typegen/introspection")).href
);
const { generateTypescript, sortGeneratorMetadata } = await import(
  pathToFileURL(require.resolve("@supabase/postgrest-typegen/generation")).href
);
const db = new Client({
  host: "127.0.0.1",
  port: 55439,
  user: "postgres",
  database: "ig001_disposable",
});
await db.connect();
try {
  const marker = await db.query("SELECT purpose FROM ig001_test.marker");
  if (marker.rows[0]?.purpose !== "disposable owner verification only")
    throw new Error("Wrong database");
  const metadata = await introspect(db, { includedSchemas: ["public"] });
  const types = await generateTypescript(sortGeneratorMetadata(metadata), {
    postgrestVersion: "12.2.3",
    detectOneToOneRelationships: true,
  });
  await writeFile(resolve(runtime, "generated-public.types.ts"), types);
  console.log(
    "Generated public types from verified local PostgreSQL schema; review before selectively adopting.",
  );
} finally {
  await db.end();
}
