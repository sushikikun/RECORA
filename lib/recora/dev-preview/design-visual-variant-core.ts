export type RecoraVisualVariant = "data-rich-final" | "legacy-current";

const LEGACY_CURRENT_VISUAL_PARAM_VALUE = "current";

type RecoraVisualSearchParam = string | string[] | null | undefined;

export function resolveRecoraVisualVariant(
  visual: RecoraVisualSearchParam,
  designPreviewEnabled: boolean
): RecoraVisualVariant {
  const value = readFirstSearchParam(visual);

  if (designPreviewEnabled && value === LEGACY_CURRENT_VISUAL_PARAM_VALUE) {
    return "legacy-current";
  }

  return "data-rich-final";
}

export function withRecoraVisualVariantSearchParam(href: string, visualVariant: RecoraVisualVariant) {
  if (!href.startsWith("/dashboard") || visualVariant !== "legacy-current") return href;

  const [pathAndQuery, hash = ""] = href.split("#", 2);
  const [path, query = ""] = pathAndQuery.split("?", 2);
  const searchParams = new URLSearchParams(query);
  searchParams.set("visual", LEGACY_CURRENT_VISUAL_PARAM_VALUE);

  const nextQuery = searchParams.toString();
  const nextHash = hash ? `#${hash}` : "";

  return `${path}${nextQuery ? `?${nextQuery}` : ""}${nextHash}`;
}

function readFirstSearchParam(value: RecoraVisualSearchParam) {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}