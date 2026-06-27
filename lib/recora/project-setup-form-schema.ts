import type { ProjectSetupSeedInput, PromptIntent } from "@/lib/recora/project-setup-draft";

export type ProjectSetupBusinessType = "b2b" | "b2c" | "mixed";

export type ProjectSetupImportantUrlKind =
  | "top"
  | "service"
  | "pricing"
  | "case_study"
  | "faq"
  | "other";

export type ProjectSetupImportantUrlInput = {
  id: string;
  kind: ProjectSetupImportantUrlKind;
  url: string;
  note: string;
};

export type ProjectSetupKnownCompetitorInput = {
  id: string;
  name: string;
  url: string;
  note: string;
};

export type ProjectSetupFormState = {
  brandName: string;
  companyName: string;
  brandAliasesText: string;
  officialSiteUrl: string;
  importantUrls: ProjectSetupImportantUrlInput[];
  businessDescription: string;
  industry: string;
  targetRegionsText: string;
  businessType: ProjectSetupBusinessType;
  primaryCustomers: string;
  knownCompetitors: ProjectSetupKnownCompetitorInput[];
  strengthsText: string;
  knownRisksText: string;
};

export const projectSetupBusinessTypeOptions = [
  { value: "b2b", label: "BtoB" },
  { value: "b2c", label: "BtoC" },
  { value: "mixed", label: "mixed" }
] satisfies { value: ProjectSetupBusinessType; label: string }[];

export const projectSetupImportantUrlKindOptions = [
  { value: "top", label: "トップページ" },
  { value: "service", label: "サービスページ" },
  { value: "pricing", label: "料金ページ" },
  { value: "case_study", label: "事例ページ" },
  { value: "faq", label: "FAQページ" },
  { value: "other", label: "その他" }
] satisfies { value: ProjectSetupImportantUrlKind; label: string }[];

export function createDefaultProjectSetupFormState(): ProjectSetupFormState {
  return {
    brandName: "",
    companyName: "",
    brandAliasesText: "",
    officialSiteUrl: "",
    importantUrls: [createImportantUrlInput("top", "url-top-initial")],
    businessDescription: "",
    industry: "",
    targetRegionsText: "Japan",
    businessType: "mixed",
    primaryCustomers: "",
    knownCompetitors: [createKnownCompetitorInput("competitor-initial")],
    strengthsText: "",
    knownRisksText: ""
  };
}

export function createImportantUrlInput(
  kind: ProjectSetupImportantUrlKind = "service",
  id = createLocalId("url")
): ProjectSetupImportantUrlInput {
  return {
    id,
    kind,
    url: "",
    note: ""
  };
}

export function createKnownCompetitorInput(id = createLocalId("competitor")): ProjectSetupKnownCompetitorInput {
  return {
    id,
    name: "",
    url: "",
    note: ""
  };
}

export function buildProjectSetupSeedInput(form: ProjectSetupFormState): ProjectSetupSeedInput {
  const brandName = form.brandName.trim();
  const businessTypeLabel = getProjectSetupBusinessTypeLabel(form.businessType);
  const industry = form.industry.trim();
  const targetCustomers = form.primaryCustomers.trim();
  const regions = splitLooseList(form.targetRegionsText);

  return {
    companyName: form.companyName.trim() || brandName,
    brandName,
    officialSiteUrl: form.officialSiteUrl.trim(),
    productOrServiceDescription: form.businessDescription.trim(),
    industryCategory: compactJoin([industry, businessTypeLabel], " / "),
    targetCustomers: compactJoin([targetCustomers, businessTypeLabel], " / "),
    regions,
    language: "ja",
    serviceName: brandName,
    brandAliases: splitLooseList(form.brandAliasesText),
    knownCompetitors: form.knownCompetitors
      .map((competitor) => competitor.name.trim())
      .filter((value) => value.length > 0),
    strengths: splitLooseList(form.strengthsText),
    knownRisks: splitLooseList(form.knownRisksText),
    diagnosisGoals: DEFAULT_PROJECT_SETUP_DIAGNOSIS_GOALS
  };
}

export function getFilledImportantUrls(form: ProjectSetupFormState) {
  return form.importantUrls
    .map((item) => ({
      kind: item.kind,
      label: getImportantUrlKindLabel(item.kind),
      url: item.url.trim(),
      note: item.note.trim()
    }))
    .filter((item) => item.url.length > 0 || item.note.length > 0);
}

export function getFilledKnownCompetitors(form: ProjectSetupFormState) {
  return form.knownCompetitors
    .map((item) => ({
      name: item.name.trim(),
      url: item.url.trim(),
      note: item.note.trim()
    }))
    .filter((item) => item.name.length > 0 || item.url.length > 0 || item.note.length > 0);
}

export function splitLooseList(value: string): string[] {
  return Array.from(new Set(
    value
      .split(/[\n,、]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  ));
}

export function joinLooseList(values: readonly string[]) {
  return values.join("\n");
}

export function getProjectSetupBusinessTypeLabel(value: ProjectSetupBusinessType) {
  if (value === "b2b") return "BtoB";
  if (value === "b2c") return "BtoC";
  return "mixed";
}

export function getImportantUrlKindLabel(value: ProjectSetupImportantUrlKind) {
  return projectSetupImportantUrlKindOptions.find((option) => option.value === value)?.label ?? "その他";
}

const DEFAULT_PROJECT_SETUP_DIAGNOSIS_GOALS: PromptIntent[] = [
  "non_branded",
  "comparison",
  "buyer_intent",
  "citation_check",
  "sentiment",
  "brand_perception"
];

function compactJoin(values: readonly string[], separator: string) {
  return values.map((value) => value.trim()).filter(Boolean).join(separator);
}

function createLocalId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
