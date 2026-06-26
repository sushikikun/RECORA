export const DESIGN_PREVIEW_BRANCH = "work/report-tabs-visual-redesign";
export const DESIGN_CHECK_REPORT_SLUG = "design-check";

export type RecoraDesignPreviewEnv = {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  VERCEL_GIT_COMMIT_REF?: string;
};

assertRecoraDesignPreviewServerOnly();

export function isRecoraDesignPreviewEnabled(env: RecoraDesignPreviewEnv = process.env) {
  const nodeEnv = env.NODE_ENV?.trim().toLowerCase() ?? "";
  const vercelEnv = env.VERCEL_ENV?.trim().toLowerCase() ?? "";
  const gitRef = env.VERCEL_GIT_COMMIT_REF?.trim() ?? "";

  if (vercelEnv === "production") return false;
  if (nodeEnv === "development") return true;

  return vercelEnv === "preview" && gitRef === DESIGN_PREVIEW_BRANCH;
}

export function getRecoraDesignPreviewLabel(env: RecoraDesignPreviewEnv = process.env) {
  const nodeEnv = env.NODE_ENV?.trim().toLowerCase() ?? "";
  const vercelEnv = env.VERCEL_ENV?.trim().toLowerCase() ?? "";
  const gitRef = env.VERCEL_GIT_COMMIT_REF?.trim() ?? "";

  if (vercelEnv === "production") return null;
  if (nodeEnv === "development") return "LOCAL DESIGN PREVIEW";
  if (vercelEnv === "preview" && gitRef === DESIGN_PREVIEW_BRANCH) return "VERCEL DESIGN PREVIEW";

  return null;
}

export function isRecoraDesignCheckSlug(projectSlug: string) {
  return projectSlug.trim() === DESIGN_CHECK_REPORT_SLUG;
}

export function canUseRecoraDesignCheck(projectSlug: string, env: RecoraDesignPreviewEnv = process.env) {
  return isRecoraDesignCheckSlug(projectSlug) && isRecoraDesignPreviewEnabled(env);
}

function assertRecoraDesignPreviewServerOnly() {
  if (typeof window !== "undefined") {
    throw new Error("Recora design preview access must only be loaded on the server.");
  }
}
