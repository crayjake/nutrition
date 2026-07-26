import { readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";

const [schema, data] = await Promise.all([
  readFile(new URL("../nutrition-plan.schema.json", import.meta.url), "utf8"),
  readFile(new URL("../nutrition-plan.json", import.meta.url), "utf8")
]);

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(JSON.parse(schema));

if (!validate(JSON.parse(data))) {
  console.error(ajv.errorsText(validate.errors, { separator: "\n" }));
  process.exit(1);
}

console.log("nutrition-plan.json is valid.");
