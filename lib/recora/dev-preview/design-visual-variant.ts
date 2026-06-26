import {
  isRecoraDesignPreviewEnabled,
  type RecoraDesignPreviewEnv
} from "./design-preview-access";
import {
  resolveRecoraVisualVariant,
  withRecoraVisualVariantSearchParam,
  type RecoraVisualVariant
} from "./design-visual-variant-core";

export type { RecoraVisualVariant };
export { withRecoraVisualVariantSearchParam };

type RecoraVisualSearchParams = Record<string, string | string[] | undefined>;

assertRecoraVisualVariantServerOnly();

export function getRecoraVisualVariant(
  searchParams?: RecoraVisualSearchParams,
  env: RecoraDesignPreviewEnv = process.env
): RecoraVisualVariant {
  return resolveRecoraVisualVariant(searchParams?.visual, isRecoraDesignPreviewEnabled(env));
}

function assertRecoraVisualVariantServerOnly() {
  if (typeof window !== "undefined") {
    throw new Error("Recora visual variants must be resolved on the server.");
  }
}