import { readFile } from "node:fs/promises";
import { join } from "node:path";

const fail = (msg) => { throw new Error(`Data validation failed: ${msg}`); };
const requiredString = (x, path) => { if (typeof x !== "string") fail(`${path} must be a string`); };
const requiredArray = (x, path) => { if (!Array.isArray(x)) fail(`${path} must be an array`); };
const unique = (items, field, path) => {
  const seen = new Set();
  for (const [i, item] of items.entries()) {
    const value = item[field];
    requiredString(value, `${path}[${i}].${field}`);
    if (!value.trim() || seen.has(value)) fail(`missing or duplicate ${path}.${field}: ${value}`);
    seen.add(value);
  }
};
const numbers = (x, key, path, min, max) => {
  if (typeof x[key] !== "number" || !Number.isFinite(x[key]) || x[key] < min || x[key] > max)
    fail(`${path}.${key} must be in [${min}, ${max}]`);
};
const read = async (path) => JSON.parse(await readFile(path, "utf8"));
const manifest = await read("data/manifest.json");
if (manifest.schemaVersion !== 1) fail("unsupported schemaVersion");
const match = /^(\d{4})-(\d{4})$/.exec(manifest.academicYear);
if (!match || Number(match[2]) !== Number(match[1]) + 1) fail("invalid academicYear");
if (typeof manifest.maintenance !== "object" || manifest.maintenance === null) fail("maintenance metadata missing");
requiredString(manifest.maintenance.lastReviewed, "maintenance.lastReviewed");
requiredString(manifest.maintenance.reviewedBy, "maintenance.reviewedBy");
const keys = ["metrics","departments","projects","alumni","cities"];
const data = {};
for (const key of keys) {
  const file = manifest.files?.[key];
  if (typeof file !== "string" || !/^[a-z-]+\.json$/.test(file)) fail(`invalid manifest.files.${key}`);
  const parsed = await read(join("data",file));
  requiredArray(parsed[key], key);
  data[key] = parsed[key];
}
for (const [i,m] of data.metrics.entries()) {
  numbers(m,"value",`metrics[${i}]`,0,Number.MAX_SAFE_INTEGER);
  requiredString(m.suffix,`metrics[${i}].suffix`);
  requiredString(m.label,`metrics[${i}].label`);
}
unique(data.departments,"id","departments");
for (const [i,d] of data.departments.entries()) {
  const p=`departments[${i}]`;
  for (const k of ["name","code","lead","description"]) requiredString(d[k],p+"."+k);
  for (const k of ["x","y"]) numbers(d,k,p,0,100);
  requiredArray(d.tech,p+".tech"); requiredArray(d.members,p+".members"); requiredArray(d.subteams,p+".subteams");
  unique(d.subteams,"id",p+".subteams");
  for (const [j,t] of d.subteams.entries()) {
    const tp=`${p}.subteams[${j}]`;
    for (const k of ["name","code","description"]) requiredString(t[k],tp+"."+k);
    for (const k of ["x","y"]) numbers(t,k,tp,0,100);
    requiredArray(t.tech,tp+".tech");
  }
}
unique(data.projects,"id","projects");
for (const [i,p] of data.projects.entries()) {
  const path=`projects[${i}]`;
  for (const k of ["name","glyph","summary","description","status","statusLabel","year","owner","bg"])
    requiredString(p[k],path+"."+k);
  if (!["live","done"].includes(p.status)) fail(`${path}.status unsupported`);
  requiredArray(p.tech,path+".tech");
  if (!p.caseStudy || typeof p.caseStudy !== "object") fail(`${path}.caseStudy missing`);
  for (const k of ["background","solution","impact"]) requiredString(p.caseStudy[k],path+".caseStudy."+k);
}
unique(data.cities,"name","cities");
const names=new Set(data.cities.map(c=>c.name));
for (const [i,c] of data.cities.entries()) {
  numbers(c,"x",`cities[${i}]`,0,760);
  numbers(c,"y",`cities[${i}]`,0,540);
}
for (const [i,a] of data.alumni.entries()) {
  const p=`alumni[${i}]`;
  for (const k of ["name","company","role","city","quote"]) requiredString(a[k],p+"."+k);
  if (!Number.isInteger(a.year) || a.year<1900 || a.year>2100) fail(`${p}.year invalid`);
  if (!names.has(a.city)) fail(`${p}.city not in cities: ${a.city}`);
}
console.log("Data OK: " + keys.map(k=>`${k}=${data[k].length}`).join(", "));
