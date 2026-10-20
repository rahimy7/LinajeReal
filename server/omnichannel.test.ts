import assert from "node:assert/strict";
import { after, test } from "node:test";
import express from "express";
import { omnichannelRouter, panelOrigin } from "./omnichannel";

const originalFetch = globalThis.fetch;
const previousUrl = process.env.OMNICHANNEL_URL;
const app = express();
app.use("/api/omnichannel", omnichannelRouter);
const server = app.listen(0, "127.0.0.1");
await new Promise<void>(resolve => server.once("listening", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("No test port");
const endpoint = `http://127.0.0.1:${address.port}/api/omnichannel/status`;

after(async () => {
  globalThis.fetch = originalFetch;
  if (previousUrl === undefined) delete process.env.OMNICHANNEL_URL;
  else process.env.OMNICHANNEL_URL = previousUrl;
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test("configuration accepts only HTTPS origins without credentials or paths", () => {
  assert.equal(panelOrigin(undefined), null);
  assert.equal(panelOrigin("https://linaje.example"), "https://linaje.example");
  for (const value of ["http://linaje.example", "https://user:password@linaje.example", "https://linaje.example/api", "https://linaje.example/?token=x", "https://linaje.example/#x", "invalid"]) {
    assert.throws(() => panelOrigin(value));
  }
});

test("missing configuration never contacts an upstream", async () => {
  delete process.env.OMNICHANNEL_URL;
  globalThis.fetch = async () => { throw new Error("unexpected fetch"); };
  const response = await originalFetch(endpoint);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { state: "not-configured" });
});

test("invalid configuration fails closed", async () => {
  process.env.OMNICHANNEL_URL = "http://linaje.example";
  const response = await originalFetch(endpoint);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { state: "configuration-error" });
});

test("only the dedicated healthy Linaje Real instance can be embedded", async () => {
  process.env.OMNICHANNEL_URL = "https://linaje.example";
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://linaje.example/api/readyz");
    assert.equal(options?.redirect, "error");
    return Response.json({ status: "ok", client: "linaje-real" });
  };
  const response = await originalFetch(endpoint);
  assert.deepEqual(await response.json(), { state: "ready", panelUrl: "https://linaje.example/" });
});

test("another client's instance is rejected without revealing its identity", async () => {
  globalThis.fetch = async () => Response.json({ status: "ok", client: "another-client" });
  const response = await originalFetch(endpoint);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { state: "wrong-instance" });
});

test("unhealthy, malformed and unreachable services produce an unavailable state", async () => {
  for (const upstream of [
    async () => Response.json({ status: "error", client: "linaje-real" }),
    async () => new Response("not json"),
    async () => new Response("private error", { status: 500 }),
    async () => { throw new Error("private infrastructure error"); },
  ]) {
    globalThis.fetch = upstream;
    const response = await originalFetch(endpoint);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { state: "unavailable" });
  }
});
