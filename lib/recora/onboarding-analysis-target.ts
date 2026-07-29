export const analysisTargetTypes = ["company", "brand", "product", "service", "store"] as const;

export type AnalysisTargetType = (typeof analysisTargetTypes)[number];
export type ProductTargetScope = "single_product" | "product_series";

type AnalysisTargetBase = {
  targetName: string;
  targetAliases: readonly string[];
  officialUrl: string;
};

export type AnalysisTargetDraft =
  | (AnalysisTargetBase & {
      targetType: "company";
      mainBusiness: string;
    })
  | (AnalysisTargetBase & {
      targetType: "brand";
      operatorName: string;
    })
  | (AnalysisTargetBase & {
      targetType: "product";
      organizationName: string;
      productScope: ProductTargetScope;
    })
  | (AnalysisTargetBase & {
      targetType: "service";
      organizationName: string;
      deliveryFormat: string;
    })
  | (AnalysisTargetBase & {
      targetType: "store";
      organizationName: string;
      location: string;
    });

export type AnalysisTargetFormInput = {
  targetType: AnalysisTargetType | null;
  targetName: string;
  targetAliases: readonly string[];
  officialUrl: string;
  mainBusiness: string;
  organizationName: string;
  productScope: ProductTargetScope;
  deliveryFormat: string;
  storeLocation: string;
};

export type AnalysisTargetUiContract = {
  label: string;
  shortDescription: string;
  identificationTitle: string;
  identificationDescription: string;
  nameLabel: string;
  namePlaceholder: string;
  aliasesLabel: string;
  aliasesPlaceholder: string;
  urlLabel: string;
  urlPlaceholder: string;
  urlHelp: string;
};

const targetUiContracts: Record<AnalysisTargetType, AnalysisTargetUiContract> = {
  company: {
    label: "企業",
    shortDescription: "会社・法人",
    identificationTitle: "企業情報",
    identificationDescription: "企業名、公式サイト、主な事業を入力してください。",
    nameLabel: "企業名",
    namePlaceholder: "例 株式会社サンプル",
    aliasesLabel: "法人名・表記ゆれ",
    aliasesPlaceholder: "例 サンプル社、Sample Inc.",
    urlLabel: "企業公式サイト",
    urlPlaceholder: "例 https://example.co.jp",
    urlHelp: "会社概要や事業内容を確認できる企業公式サイトを入力してください。"
  },
  brand: {
    label: "ブランド",
    shortDescription: "ブランド全体",
    identificationTitle: "ブランド情報",
    identificationDescription: "ブランド名、運営会社、公式サイトを入力してください。",
    nameLabel: "ブランド名",
    namePlaceholder: "例 Recora",
    aliasesLabel: "別名・表記ゆれ",
    aliasesPlaceholder: "例 レコラ、RECORA",
    urlLabel: "ブランド公式サイト",
    urlPlaceholder: "例 https://recora.example",
    urlHelp: "企業サイトではなく、ブランドの内容が分かる公式ページを優先してください。"
  },
  product: {
    label: "商品",
    shortDescription: "商品・シリーズ",
    identificationTitle: "商品情報",
    identificationDescription: "商品名、ブランド・メーカー、対象範囲を入力してください。",
    nameLabel: "商品名",
    namePlaceholder: "例 Recora Insight",
    aliasesLabel: "型番・略称・表記ゆれ",
    aliasesPlaceholder: "例 Insight、RC-100",
    urlLabel: "商品ページ",
    urlPlaceholder: "例 https://example.jp/products/insight",
    urlHelp: "企業トップではなく、対象商品の詳細が分かる公式ページを入力してください。"
  },
  service: {
    label: "サービス",
    shortDescription: "SaaS・提供サービス",
    identificationTitle: "サービス情報",
    identificationDescription: "サービス名、提供会社、提供形式を入力してください。",
    nameLabel: "サービス名",
    namePlaceholder: "例 Recora",
    aliasesLabel: "略称・旧称・表記ゆれ",
    aliasesPlaceholder: "例 レコラ、Recora AI",
    urlLabel: "サービス紹介ページ",
    urlPlaceholder: "例 https://example.jp/service",
    urlHelp: "サービス内容・料金・対象顧客などが分かる公式ページを入力してください。"
  },
  store: {
    label: "店舗",
    shortDescription: "店舗・支店",
    identificationTitle: "店舗情報",
    identificationDescription: "店舗名、所在地、店舗ページを入力してください。",
    nameLabel: "店舗・支店名",
    namePlaceholder: "例 Recora 渋谷店",
    aliasesLabel: "略称・表記ゆれ",
    aliasesPlaceholder: "例 渋谷店、Recora Shibuya",
    urlLabel: "店舗個別ページ",
    urlPlaceholder: "例 https://example.jp/shops/shibuya",
    urlHelp: "チェーンのトップではなく、対象店舗の所在地や情報が分かる個別ページを入力してください。"
  }
};

export function getAnalysisTargetUiContract(targetType: AnalysisTargetType) {
  return targetUiContracts[targetType];
}

export function getAnalysisTargetLabel(targetType: AnalysisTargetType | null) {
  return targetType ? targetUiContracts[targetType].label : "未選択";
}

export function buildAnalysisTargetDraft(input: AnalysisTargetFormInput): AnalysisTargetDraft | null {
  if (!input.targetType) return null;

  const base = {
    targetName: input.targetName.trim(),
    targetAliases: normalizeList(input.targetAliases),
    officialUrl: normalizeUrl(input.officialUrl)
  };

  if (input.targetType === "company") {
    return { ...base, targetType: "company", mainBusiness: input.mainBusiness.trim() };
  }
  if (input.targetType === "brand") {
    return { ...base, targetType: "brand", operatorName: input.organizationName.trim() };
  }
  if (input.targetType === "product") {
    return {
      ...base,
      targetType: "product",
      organizationName: input.organizationName.trim(),
      productScope: input.productScope
    };
  }
  if (input.targetType === "service") {
    return {
      ...base,
      targetType: "service",
      organizationName: input.organizationName.trim(),
      deliveryFormat: input.deliveryFormat.trim()
    };
  }
  return {
    ...base,
    targetType: "store",
    organizationName: input.organizationName.trim(),
    location: input.storeLocation.trim()
  };
}

export function validateAnalysisTargetInput(input: AnalysisTargetFormInput) {
  const blockers: string[] = [];
  if (!input.targetType) return ["分析対象の種類を選んでください。"];

  const contract = getAnalysisTargetUiContract(input.targetType);
  if (!input.targetName.trim()) blockers.push(`${contract.nameLabel}を入力してください。`);
  if (!input.officialUrl.trim()) blockers.push(`${contract.urlLabel}を入力してください。`);

  const normalizedUrl = normalizeUrl(input.officialUrl);
  if (normalizedUrl && !isHttpUrl(normalizedUrl)) {
    blockers.push(`${contract.urlLabel}はURLとして扱える形式で入力してください。`);
  }

  if (input.targetType === "company" && !input.mainBusiness.trim()) {
    blockers.push("主な事業を入力してください。");
  }
  if (input.targetType === "brand" && !input.organizationName.trim()) {
    blockers.push("運営会社を入力してください。");
  }
  if (input.targetType === "product" && !input.organizationName.trim()) {
    blockers.push("ブランド・メーカー名を入力してください。");
  }
  if (input.targetType === "service" && !input.organizationName.trim()) {
    blockers.push("提供会社・ブランド名を入力してください。");
  }
  if (input.targetType === "service" && !input.deliveryFormat.trim()) {
    blockers.push("提供形式を入力してください。");
  }
  if (input.targetType === "store" && !input.storeLocation.trim()) {
    blockers.push("店舗所在地を入力してください。");
  }

  return blockers;
}

export function toLegacyProjectSetupTargetSeed(target: AnalysisTargetDraft) {
  const organizationName = getTargetOrganizationName(target);
  return {
    companyName: organizationName || target.targetName,
    brandName: target.targetName,
    serviceName: target.targetName,
    brandAliases: [...target.targetAliases],
    officialSiteUrl: target.officialUrl,
    identificationContext: buildIdentificationContext(target)
  };
}

function getTargetOrganizationName(target: AnalysisTargetDraft) {
  if (target.targetType === "company") return target.targetName;
  if (target.targetType === "brand") return target.operatorName;
  if (target.targetType === "product" || target.targetType === "service" || target.targetType === "store") {
    return target.organizationName;
  }
  return "";
}

function buildIdentificationContext(target: AnalysisTargetDraft) {
  const typeLabel = getAnalysisTargetLabel(target.targetType);
  const parts = [`分析対象種別: ${typeLabel}`, `分析対象名: ${target.targetName}`];

  if (target.targetType === "company") parts.push(`主な事業: ${target.mainBusiness}`);
  if (target.targetType === "brand") parts.push(`運営会社: ${target.operatorName}`);
  if (target.targetType === "product") {
    parts.push(`ブランド・メーカー: ${target.organizationName}`);
    parts.push(`対象範囲: ${target.productScope === "single_product" ? "単一商品" : "商品シリーズ"}`);
  }
  if (target.targetType === "service") {
    parts.push(`提供会社・ブランド: ${target.organizationName}`);
    parts.push(`提供形式: ${target.deliveryFormat}`);
  }
  if (target.targetType === "store") {
    if (target.organizationName) parts.push(`所属チェーン・ブランド: ${target.organizationName}`);
    parts.push(`店舗所在地: ${target.location}`);
  }

  return parts.join("\n");
}

function normalizeList(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
