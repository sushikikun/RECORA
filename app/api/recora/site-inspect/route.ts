import { inspectOfficialSite, SiteInspectionError } from "@/lib/recora/site-inspection";
import type { SiteInspectionApiResponse } from "@/lib/recora/site-inspection-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  url?: unknown;
  brandName?: unknown;
  aliases?: unknown;
};

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return jsonResponse(
      {
        ok: false,
        code: "site_inspection_invalid_request",
        error: "公式URLの確認リクエストを読み取れませんでした。"
      },
      400
    );
  }

  const url = typeof body.url === "string" ? body.url : "";
  const brandName = typeof body.brandName === "string" ? body.brandName : "";
  const aliases = Array.isArray(body.aliases) ? body.aliases.filter((alias): alias is string => typeof alias === "string") : [];

  try {
    const result = await inspectOfficialSite({ url, brandName, aliases });
    return jsonResponse({ ok: true, result }, 200);
  } catch (error) {
    if (error instanceof SiteInspectionError) {
      return jsonResponse(
        {
          ok: false,
          code: error.code,
          error: error.message
        },
        error.status
      );
    }

    const message =
      error instanceof Error ? error.message : "公式URLのページ情報を確認できませんでした。内容を入力して進められます。";
    return jsonResponse(
      {
        ok: false,
        code: "site_inspection_failed",
        error: message,
        warnings: ["site_inspection_failed"]
      },
      200
    );
  }
}

function jsonResponse(body: SiteInspectionApiResponse, status: number) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
