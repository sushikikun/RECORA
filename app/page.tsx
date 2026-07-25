import type { Metadata } from "next";
import Script from "next/script";

import { RecoraMarketingHome, recoraMarketingFaqs } from "@/components/recora/marketing/home-page";

function getPublicBaseUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!rawUrl) return undefined;

  try {
    return new URL(rawUrl);
  } catch {
    return undefined;
  }
}

const publicBaseUrl = getPublicBaseUrl();

export const metadata: Metadata = {
  metadataBase: publicBaseUrl,
  title: "Recora｜AIは、御社をどう見て、誰と比べているか。",
  description:
    "Recoraは、AI回答での自社と競合の見え方、説明、参照情報を毎日確認するGEO・LLMOモニタリングサービスです。専門知識がなくても、比較される質問から次に見直すページまで整理できます。",
  alternates: publicBaseUrl ? { canonical: "/" } : undefined,
  openGraph: {
    title: "Recora｜AIは、御社をどう見て、誰と比べているか。",
    description: "AI回答での自社と競合の見え方、説明、参照情報を毎日確認し、次に見直すページまで整理します。",
    images: [{ url: "/og/recora-lp.png", width: 1200, height: 630, alt: "Recora" }],
    locale: "ja_JP",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Recora｜AIは、御社をどう見て、誰と比べているか。",
    description: "AI回答での自社と競合の見え方、説明、参照情報を毎日確認し、次に見直すページまで整理します。",
    images: ["/og/recora-lp.png"]
  },
  icons: {
    icon: "/brand/favicon.ico",
    apple: "/brand/apple-touch-icon.png"
  }
};

export default function HomePage() {
  return (
    <>
      <Script
        id="recora-organization-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Recora",
            ...(publicBaseUrl ? { url: publicBaseUrl.toString() } : {}),
            description:
              "AI回答での自社と競合の見え方、説明、参照情報を毎日確認し、次に見直すページを整理するGEO・LLMOモニタリングサービス"
          })
        }}
      />
      <Script
        id="recora-faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: recoraMarketingFaqs.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer
              }
            }))
          })
        }}
      />
      <RecoraMarketingHome />
    </>
  );
}
