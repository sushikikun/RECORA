export type RecoraPlanId = "free-preview" | "trial-audit" | "monitor-basic" | "monitor-standard" | "monitor-growth";

export type RecoraPlan = {
  id: RecoraPlanId;
  name: string;
  priceLabel: string;
  priceJpy: number;
  billing: "free" | "one_time" | "monthly";
  questions: number;
  models: number;
  measurement: string;
  improvement: boolean;
  description: string;
  ctaLabel: string;
};

export const recoraPlans: readonly RecoraPlan[] = [
  {
    id: "free-preview",
    name: "Free Preview",
    priceLabel: "0円",
    priceJpy: 0,
    billing: "free",
    questions: 50,
    models: 1,
    measurement: "1回診断",
    improvement: false,
    description: "まず、AI検索での見え方を確認したい方向け。",
    ctaLabel: "無料で始める"
  },
  {
    id: "trial-audit",
    name: "Trial Audit",
    priceLabel: "9,800円",
    priceJpy: 9800,
    billing: "one_time",
    questions: 100,
    models: 2,
    measurement: "1回診断",
    improvement: false,
    description: "比較される質問を広げて、一度しっかり確認したい方向け。",
    ctaLabel: "このプランを相談する"
  },
  {
    id: "monitor-basic",
    name: "Monitor Basic",
    priceLabel: "12,800円/月",
    priceJpy: 12800,
    billing: "monthly",
    questions: 50,
    models: 2,
    measurement: "毎日計測",
    improvement: false,
    description: "まずは毎日の変化を追い始めたい方向け。",
    ctaLabel: "このプランを相談する"
  },
  {
    id: "monitor-standard",
    name: "Monitor Standard",
    priceLabel: "29,800円/月",
    priceJpy: 29800,
    billing: "monthly",
    questions: 100,
    models: 2,
    measurement: "毎日計測",
    improvement: true,
    description: "変化を追いながら、次に確認することも整理したい方向け。",
    ctaLabel: "このプランを相談する"
  },
  {
    id: "monitor-growth",
    name: "Monitor Growth",
    priceLabel: "69,800円/月",
    priceJpy: 69800,
    billing: "monthly",
    questions: 200,
    models: 3,
    measurement: "毎日計測",
    improvement: true,
    description: "複数の質問群を継続的に確認したいチーム向け。",
    ctaLabel: "このプランを相談する"
  }
] as const;

export function getPaidRecoraPlan(planId: string | null): RecoraPlan | undefined {
  return recoraPlans.find((plan) => plan.id === planId && plan.billing !== "free");
}
