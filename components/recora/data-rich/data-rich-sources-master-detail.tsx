"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

import {
  DataRichBadge,
  DataRichEmpty,
  DataRichInlineBar,
  DataRichPanel,
  DataRichSplit
} from "@/components/recora/data-rich/data-rich-primitives";
import { cn } from "@/lib/utils";

export type DataRichSourceMasterRow = {
  domain: string;
  category: string;
  sourceType: string;
  appearances: number;
  citationShare: number;
  trustScore: number;
  trustLabel: string;
  supportingCitationCount: number;
  needsClaimReviewCount: number;
  urls: string[];
  recommendedAction: string;
};

export function DataRichSourcesMasterDetail({
  rows
}: {
  rows: DataRichSourceMasterRow[];
}) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(rows[0]?.domain ?? null);
  const selected = useMemo(
    () => rows.find((row) => row.domain === selectedDomain) ?? rows[0] ?? null,
    [rows, selectedDomain]
  );
  const max = Math.max(1, ...rows.map((row) => row.appearances));

  return (
    <DataRichSplit
      main={
        <DataRichPanel
          title="参照元ドメイン一覧"
          description="出現数、構成比、確認状況、主なURLをドメイン単位で確認します。"
          className="border-0"
          bodyClassName="p-0"
        >
          {rows.length > 0 ? (
            <div className="divide-y divide-[#E5EAE8]">
              {rows.slice(0, 12).map((row) => {
                const isSelected = selected?.domain === row.domain;
                const safeUrl = row.urls.map(getSafeExternalHref).find(Boolean) ?? null;

                return (
                  <button
                    key={row.domain}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDomain(row.domain)}
                    className={cn(
                      "grid w-full min-w-0 gap-3 px-4 py-3 text-left text-sm transition hover:bg-[#F4FAF7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B57]/70 focus-visible:ring-inset xl:grid-cols-[minmax(180px,1.4fr)_112px_160px_72px_86px_72px] xl:items-center",
                      isSelected && "bg-[#EAF6F0]/70"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="line-clamp-2 break-all font-bold leading-5 text-[#0F172A]" title={row.domain}>{row.domain}</p>
                      <p className="mt-0.5 line-clamp-2 break-all text-[11px] font-semibold leading-4 text-[#64748B]" title={safeUrl ?? row.urls[0] ?? ""}>
                        {safeUrl ?? row.urls[0] ?? "-"}
                      </p>
                    </div>
                    <div className="line-clamp-2 text-[12px] font-semibold leading-5 text-[#1F2937]" title={row.category}>{row.category}</div>
                    <DataRichInlineBar value={(row.appearances / max) * 100} label={`${row.appearances}件`} />
                    <div className="font-semibold tabular-nums text-[#0F172A]">{row.citationShare}%</div>
                    <div>
                      <DataRichBadge tone={row.trustScore >= 70 ? "green" : row.trustScore >= 45 ? "amber" : "red"}>
                        {row.trustLabel}
                      </DataRichBadge>
                    </div>
                    <div className="font-semibold tabular-nums text-[#0F172A]">{row.needsClaimReviewCount}件</div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4">
              <DataRichEmpty message="参照元ドメインはまだありません。引用URLが保存されると表示します。" />
            </div>
          )}
        </DataRichPanel>
      }
      aside={<SourceDetail row={selected} />}
    />
  );
}

function SourceDetail({ row }: { row: DataRichSourceMasterRow | null }) {
  if (!row) {
    return (
      <div className="p-4">
        <DataRichEmpty message="選択できる参照元はまだありません。" />
      </div>
    );
  }

  const safeUrls = row.urls.map(getSafeExternalHref).filter((value): value is string => Boolean(value));
  const mainUrl = safeUrls[0] ?? null;

  return (
    <div className="space-y-3 p-4">
      <h2 className="text-[15px] font-bold text-[#0F172A]">選択中のドメイン</h2>
      <div className="rounded-md border border-[#DFE6E2] bg-white p-3">
        <div className="border-b border-[#E5EAE8] pb-3">
          <p className="break-words text-[16px] font-bold text-[#0F172A]" title={row.domain}>{row.domain}</p>
          <p className="mt-1 text-[12px] font-semibold text-[#64748B]">{row.category}</p>
        </div>

        <dl className="grid gap-0 divide-y divide-[#E5EAE8]">
          <SourceFact label="ドメイン" value={row.domain} />
          <SourceFact label="分類" value={row.category} />
          <SourceFact label="出現数" value={`${row.appearances.toLocaleString("ja-JP")}件`} />
          <SourceFact label="参照シェア" value={`${row.citationShare}%`} />
          <SourceFact label="状態" value={row.trustLabel} />
          <SourceFact label="要確認" value={`${row.needsClaimReviewCount.toLocaleString("ja-JP")}件`} />
          <SourceFact label="主なURL" value={mainUrl ?? "-"} href={mainUrl} />
          <SourceFact label="次に確認" value={row.recommendedAction} />
        </dl>

        {safeUrls.length > 1 ? (
          <div className="mt-3 border-t border-[#E5EAE8] pt-3">
            <p className="text-[12px] font-bold text-[#64748B]">その他のURL</p>
            <div className="mt-2 space-y-1.5">
              {safeUrls.slice(1, 5).map((url) => (
                <SafeExternalLink key={url} href={url} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SourceFact({ label, value, href }: { label: string; value: string; href?: string | null }) {
  return (
    <div className="grid grid-cols-[82px_minmax(0,1fr)] gap-3 py-2">
      <dt className="text-[11px] font-bold text-[#64748B]">{label}</dt>
      <dd className="min-w-0 text-[13px] font-bold tabular-nums text-[#0F172A]">
        {href ? <SafeExternalLink href={href} /> : <span className="break-words" title={value}>{value}</span>}
      </dd>
    </div>
  );
}

function SafeExternalLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={href}
      className="inline-flex max-w-full min-w-0 items-start gap-1.5 text-[#006B57] hover:text-[#005548] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B57]/70"
    >
      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="line-clamp-3 min-w-0 break-all leading-5">{href}</span>
    </a>
  );
}

function getSafeExternalHref(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
