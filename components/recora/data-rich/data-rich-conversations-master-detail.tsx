"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

import {
  DataRichBadge,
  DataRichEmpty,
  DataRichPanel,
  DataRichSplit
} from "@/components/recora/data-rich/data-rich-primitives";
import { cn } from "@/lib/utils";

export type DataRichConversationSourceLink = {
  domain: string;
  title: string;
  url: string | null;
};

export type DataRichConversationMasterRow = {
  id: string;
  topicName: string;
  personaName: string;
  promptText: string;
  modelName: string;
  date: string;
  recoraMentioned: boolean;
  recoraRank: number | null;
  mentionedBrands: string[];
  citedDomains: string[];
  sourceLinks: DataRichConversationSourceLink[];
  answerSummary: string;
  rawAnswer: string;
  observationKind: "openai" | "unknown";
  observationLabel: string;
  citationStatusLabel: string;
  webSearchLabel: string;
  measuredAtLabel: string;
};

export function DataRichConversationsMasterDetail({
  rows
}: {
  rows: DataRichConversationMasterRow[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId]
  );

  return (
    <DataRichSplit
      main={
        <DataRichPanel
          title="質問別の回答"
          description="質問、モデル、表示状況、参照元を回答単位で確認します。"
          className="border-0"
          bodyClassName="p-0"
        >
          {rows.length > 0 ? (
            <div className="divide-y divide-[#E5EAE8]">
              {rows.map((row, index) => {
                const isSelected = selected?.id === row.id;

                return (
                  <button
                    key={row.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedId(row.id)}
                    className={cn(
                      "grid w-full min-w-0 gap-3 px-4 py-3 text-left text-sm transition hover:bg-[#F4FAF7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B57]/70 focus-visible:ring-inset xl:grid-cols-[40px_minmax(0,1.55fr)_132px_124px_minmax(0,0.78fr)] xl:items-center",
                      isSelected && "bg-[#EAF6F0]/70"
                    )}
                  >
                    <div className="font-bold tabular-nums text-[#64748B]">{index + 1}</div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-start gap-2">
                        <span className="line-clamp-2 min-w-0 font-bold leading-5 text-[#0F172A]" title={row.promptText}>
                          {row.promptText}
                        </span>
                        <DataRichBadge tone={row.observationKind === "openai" ? "green" : "default"}>
                          {row.observationLabel}
                        </DataRichBadge>
                      </div>
                      <p className="mt-1 line-clamp-1 text-[12px] font-semibold text-[#64748B]" title={`${row.topicName} / ${row.personaName}`}>
                        {row.topicName} / {row.personaName}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-bold leading-5 text-[#0F172A]" title={row.modelName}>{row.modelName}</p>
                      <p className="mt-1 text-[11px] font-semibold tabular-nums text-[#64748B]">{row.date}</p>
                    </div>
                    <div className="min-w-0 space-y-1">
                      {row.recoraMentioned ? (
                        <DataRichBadge tone="green">表示あり {row.recoraRank ?? "-"}</DataRichBadge>
                      ) : (
                        <DataRichBadge tone="red">未表示</DataRichBadge>
                      )}
                      <p className="line-clamp-1 text-[11px] font-semibold text-[#64748B]" title={row.mentionedBrands.join(" / ")}>
                        {row.mentionedBrands.join(" / ") || "-"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-[12px] font-bold text-[#0F172A]" title={row.citedDomains.join(" / ")}>
                        {row.citedDomains.join(" / ") || "参照元なし"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#64748B]">{row.answerSummary}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4">
              <DataRichEmpty message="AI回答ログはまだありません。測定が完了するとここに表示します。" />
            </div>
          )}
        </DataRichPanel>
      }
      aside={
        <ConversationDetail row={selected} />
      }
    />
  );
}

function ConversationDetail({ row }: { row: DataRichConversationMasterRow | null }) {
  if (!row) {
    return (
      <div className="p-4">
        <DataRichEmpty message="選択できる回答はまだありません。" />
      </div>
    );
  }

  const displayStatus = row.recoraMentioned ? `表示あり ${row.recoraRank ?? "-"}位` : "未表示";
  const safeLinks = row.sourceLinks.filter((source) => getSafeExternalHref(source.url));

  return (
    <div className="space-y-3 p-4">
      <h2 className="text-[15px] font-bold text-[#0F172A]">選択中の回答</h2>
      <div className="rounded-md border border-[#DFE6E2] bg-white p-3">
        <div className="border-b border-[#E5EAE8] pb-3">
          <p className="text-[12px] font-bold text-[#64748B]">質問</p>
          <p className="mt-1 whitespace-pre-wrap text-[13px] font-semibold leading-6 text-[#0F172A]">{row.promptText}</p>
        </div>

        <dl className="grid gap-0 divide-y divide-[#E5EAE8]">
          <ConversationFact label="AIモデル" value={row.modelName} />
          <ConversationFact label="表示状況" value={displayStatus} />
          <ConversationFact label="引用状況" value={row.citationStatusLabel} />
          <ConversationFact label="Web検索" value={row.webSearchLabel} />
          <ConversationFact label="測定日時" value={row.measuredAtLabel} />
        </dl>

        <div className="border-t border-[#E5EAE8] pt-3">
          <p className="text-[12px] font-bold text-[#64748B]">回答要約</p>
          <p className="mt-1 text-[13px] leading-6 text-[#1F2937]">{row.answerSummary}</p>
        </div>

        <div className="mt-3 border-t border-[#E5EAE8] pt-3">
          <p className="text-[12px] font-bold text-[#64748B]">主な参照元</p>
          {safeLinks.length > 0 ? (
            <div className="mt-2 space-y-2">
              {safeLinks.slice(0, 5).map((source) => (
                <ExternalSourceLink key={`${source.domain}-${source.url}`} source={source} />
              ))}
            </div>
          ) : (
            <p className="mt-1 text-[13px] leading-6 text-[#64748B]">
              {row.citedDomains.join(" / ") || "参照元なし"}
            </p>
          )}
        </div>

        <details className="mt-3 border-t border-[#E5EAE8] pt-3">
          <summary className="cursor-pointer text-[12px] font-bold text-[#006B57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B57]/70">
            回答全文
          </summary>
          <p className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[12px] leading-6 text-[#1F2937]">
            {row.rawAnswer}
          </p>
        </details>
      </div>
    </div>
  );
}

function ConversationFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 py-2">
      <dt className="text-[11px] font-bold text-[#64748B]">{label}</dt>
      <dd className="break-words text-[13px] font-bold tabular-nums text-[#0F172A]" title={value}>{value}</dd>
    </div>
  );
}

function ExternalSourceLink({ source }: { source: DataRichConversationSourceLink }) {
  const href = getSafeExternalHref(source.url);

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={href}
      className="flex min-w-0 items-start gap-2 rounded-md border border-[#E1E8E5] bg-[#FAFCFB] px-2.5 py-2 text-[12px] font-semibold text-[#006B57] hover:border-[#006B57]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006B57]/70"
    >
      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block truncate text-[#0F172A]">{source.title || source.domain}</span>
        <span className="block truncate text-[#64748B]">{href}</span>
      </span>
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
