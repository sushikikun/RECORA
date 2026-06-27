import type { Metadata } from "next";
import Script from "next/script";

import { RecoraLandingPage } from "@/components/recora/lp/recora-landing-page";
import { recoraLandingFaqs } from "@/components/recora/lp/recora-landing-data";

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
  title: "Recora｜AIは、御社を候補に挙げていますか？無料AI検索診断",
  description:
    "見込み客がAIに尋ねる質問を実際に調査し、自社が候補に入る質問、競合だけが挙がる質問、回答内の参照元、次に見直す情報を整理する無料AI検索診断です。",
  alternates: publicBaseUrl ? { canonical: "/" } : undefined,
  openGraph: {
    title: "Recora｜AIは、御社を候補に挙げていますか？",
    description: "候補に入る質問、競合だけが挙がる質問、回答内の参照元、次に見直す情報を質問ごとに診断します。",
    images: [{ url: "/og/recora-lp.png", width: 1200, height: 630, alt: "Recora" }],
    locale: "ja_JP",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Recora｜AIは、御社を候補に挙げていますか？",
    description: "候補に入る質問、競合だけが挙がる質問、回答内の参照元、次に見直す情報を質問ごとに診断します。",
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
              "見込み客がAIに尋ねる質問を実際に調査し、自社・競合の候補入り、回答内の参照元、次に見直す情報を整理するAI検索診断サービス"
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
            mainEntity: recoraLandingFaqs.map((item) => ({
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
      <RecoraLandingPage />
    </>
  );
}
