require("dotenv").config();
const key = process.env.GEMINI_API_KEY;
async function go() {
  const fetch = globalThis.fetch;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const json = await res.json();
  console.log(json.models?.map(m => m.name).join(", "));
}
go();
