import assert from "node:assert/strict";

import {
  extractPageMetadataFromHtml,
  inferSiteInspectionCategory,
  isPublicIpAddressForInspection,
  normalizePublicHttpUrlForInspection,
  readResponseTextWithLimit,
  resolveRedirectUrlForInspection,
  SiteInspectionError
} from "../lib/recora/site-inspection";

async function main() {
  await assertRejectsWithCode(() => normalizePublicHttpUrlForInspection("ftp://example.com"), "site_inspection_protocol_not_allowed");
  await assertRejectsWithCode(() => normalizePublicHttpUrlForInspection("http://localhost"), "site_inspection_host_not_allowed");
  await assertRejectsWithCode(() => normalizePublicHttpUrlForInspection("http://127.0.0.1"), "site_inspection_host_not_allowed");
  await assertRejectsWithCode(() => normalizePublicHttpUrlForInspection("http://10.0.0.1"), "site_inspection_host_not_allowed");
  await assertRejectsWithCode(() => normalizePublicHttpUrlForInspection("http://192.168.0.10"), "site_inspection_host_not_allowed");
  await assertRejectsWithCode(
    () => resolveRedirectUrlForInspection("https://example.com", "http://127.0.0.1/admin"),
    "site_inspection_host_not_allowed"
  );

  assert.equal(isPublicIpAddressForInspection("8.8.8.8"), true);
  assert.equal(isPublicIpAddressForInspection("127.0.0.1"), false);
  assert.equal(isPublicIpAddressForInspection("172.16.1.1"), false);
  assert.equal(isPublicIpAddressForInspection("::1"), false);
  assert.equal(isPublicIpAddressForInspection("fc00::1"), false);

  const html = `
    <!doctype html>
    <html lang="ja">
      <head>
        <title>Recora | AI検索での見え方を診断</title>
        <meta content="LLM時代の検索可視性を測るBtoB向け分析サービスです。" name="description">
        <meta property="og:site_name" content="Recora">
        <link href="/canonical" rel="canonical">
      </head>
      <body><h1>AI検索最適化プラットフォーム</h1></body>
    </html>
  `;
  const metadata = extractPageMetadataFromHtml(html);
  assert.equal(metadata.title, "Recora | AI検索での見え方を診断");
  assert.equal(metadata.description, "LLM時代の検索可視性を測るBtoB向け分析サービスです。");
  assert.equal(metadata.siteName, "Recora");
  assert.equal(metadata.h1, "AI検索最適化プラットフォーム");
  assert.equal(metadata.canonicalUrl, "/canonical");
  assert.equal(inferSiteInspectionCategory(metadata), "SEO / AI検索対策");

  const largeResponse = new Response("a".repeat(400 * 1024), {
    headers: { "content-type": "text/html" }
  });
  const { text, truncated } = await readResponseTextWithLimit(largeResponse, 300 * 1024);
  assert.equal(truncated, true);
  assert.equal(Buffer.byteLength(text, "utf8"), 300 * 1024);

  console.log("Recora site inspection safeguards passed.");
}

async function assertRejectsWithCode(fn: () => Promise<unknown>, code: string) {
  try {
    await fn();
  } catch (error) {
    assert.ok(error instanceof SiteInspectionError, `Expected SiteInspectionError for ${code}`);
    assert.equal(error.code, code);
    return;
  }
  assert.fail(`Expected rejection with ${code}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
