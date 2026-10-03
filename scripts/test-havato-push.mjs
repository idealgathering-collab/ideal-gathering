let token = "";
for await (const chunk of process.stdin) {
  token += chunk.toString("utf8");
  if (token.length > 8192) throw new Error("Session token too long");
}
token = token.trim();
if (!token || /\s/.test(token))
  throw new Error(
    "Supply only your Havato session access token on stdin, not in command arguments",
  );
const response = await fetch("https://havato-test.darkube.ir/api/push/test", {
  method: "POST",
  headers: {
    authorization: `Bearer ${token}`,
    origin: "https://havato-test.darkube.ir",
    "content-type": "application/json",
  },
  body: JSON.stringify({ lang: process.argv[2] === "fa" ? "fa" : "en" }),
  signal: AbortSignal.timeout(240_000),
});
token = "";
console.log("HTTP", response.status);
console.log(await response.json());
if (!response.ok) process.exitCode = 1;
