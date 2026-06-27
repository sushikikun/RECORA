import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, LockKeyhole, Mail } from "lucide-react";

import { sanitizeRecoraAuthNextPath } from "@/lib/recora/auth-access";
import { createRecoraAccount } from "./actions";

type SignupPageProps = {
  searchParams?: {
    error?: string;
    next?: string;
    sent?: string;
  };
};

export const dynamic = "force-dynamic";

export default function SignupPage({ searchParams = {} }: SignupPageProps) {
  const nextPath = sanitizeRecoraAuthNextPath(searchParams.next);
  const message = getSignupMessage(searchParams);

  return (
    <main className="min-h-screen bg-[#F6FAF9] px-5 py-8 text-slate-950 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center">
        <section className="grid w-full overflow-hidden rounded-lg border border-[#DDE8E5] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] md:grid-cols-[0.92fr_1.08fr]">
          <div className="bg-[#073D36] px-6 py-7 text-white sm:px-8 sm:py-9">
            <Link className="inline-flex items-center gap-2 text-sm font-bold" href="/">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#D8F36A] text-[#073D36]">
                R
              </span>
              Recora
            </Link>
            <div className="mt-12 max-w-sm">
              <p className="text-sm font-bold text-[#D8F36A]">無料AI検索診断</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight tracking-normal sm:text-4xl">
                無料AI検索診断の準備をはじめる
              </h1>
              <p className="mt-4 text-base leading-7 text-white/78">
                診断準備と結果保存のため、アカウントを作成してください。メール確認後、診断に必要な会社情報の入力へ進めます。
              </p>
            </div>
            <ul className="mt-10 space-y-3 text-sm leading-6 text-white/72">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D8F36A]" />
                クレジットカード不要
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D8F36A]" />
                メール確認後に会社情報を入力できます
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D8F36A]" />
                パスワードは8文字以上
              </li>
            </ul>
          </div>

          <div className="px-6 py-7 sm:px-8 sm:py-9">
            {message ? <AuthMessage message={message} /> : null}

            <form action={createRecoraAccount} className="mt-6 space-y-5">
              <input type="hidden" name="next" value={nextPath} />
              <label className="block">
                <span className="text-sm font-bold text-slate-700">メールアドレス</span>
                <span className="mt-2 flex h-12 items-center gap-2 rounded-md border border-[#DDE8E5] bg-white px-4 transition focus-within:border-[#00796B] focus-within:ring-2 focus-within:ring-[#00796B]/15">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    className="h-full min-w-0 flex-1 bg-transparent text-base text-slate-950 outline-none placeholder:text-slate-400"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                  />
                </span>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">パスワード</span>
                <span className="mt-2 flex h-12 items-center gap-2 rounded-md border border-[#DDE8E5] bg-white px-4 transition focus-within:border-[#00796B] focus-within:ring-2 focus-within:ring-[#00796B]/15">
                  <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    className="h-full min-w-0 flex-1 bg-transparent text-base text-slate-950 outline-none placeholder:text-slate-400"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="8文字以上"
                    required
                  />
                </span>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">パスワード確認</span>
                <span className="mt-2 flex h-12 items-center gap-2 rounded-md border border-[#DDE8E5] bg-white px-4 transition focus-within:border-[#00796B] focus-within:ring-2 focus-within:ring-[#00796B]/15">
                  <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    className="h-full min-w-0 flex-1 bg-transparent text-base text-slate-950 outline-none placeholder:text-slate-400"
                    name="passwordConfirmation"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="もう一度入力"
                    required
                  />
                </span>
              </label>
              <button
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#00796B] px-5 text-base font-bold text-white shadow-sm shadow-teal-900/10 transition hover:bg-[#005C50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2"
                type="submit"
              >
                アカウントを作成する
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-3 border-t border-[#E8F0ED] pt-5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span>すでに登録済みの方はログイン</span>
              <Link className="font-bold text-[#00796B] hover:text-[#005C50]" href={`/login?next=${encodeURIComponent(nextPath)}`}>
                ログイン
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

type AuthMessageData = {
  tone: "error" | "success";
  text: string;
};

function AuthMessage({ message }: { message: AuthMessageData }) {
  const isError = message.tone === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      className={
        isError
          ? "rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium leading-6 text-rose-700"
          : "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-700"
      }
    >
      <div className="flex gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{message.text}</span>
      </div>
    </div>
  );
}

function getSignupMessage(searchParams: SignupPageProps["searchParams"]): AuthMessageData | null {
  if (searchParams?.sent) {
    return {
      tone: "success",
      text: "確認メールを送信しました。メール内のリンクから登録を完了してください。"
    };
  }

  if (searchParams?.error === "email_required") {
    return {
      tone: "error",
      text: "メールアドレスを入力してください。"
    };
  }

  if (searchParams?.error === "invalid_email") {
    return {
      tone: "error",
      text: "メールアドレスの形式を確認してください。"
    };
  }

  if (searchParams?.error === "password_length") {
    return {
      tone: "error",
      text: "パスワードは8文字以上で入力してください。"
    };
  }

  if (searchParams?.error === "password_mismatch") {
    return {
      tone: "error",
      text: "パスワードが一致しません。"
    };
  }

  if (searchParams?.error === "config") {
    return {
      tone: "error",
      text: "Supabaseの認証設定が不足しています。"
    };
  }

  if (searchParams?.error === "auth_origin") {
    return {
      tone: "error",
      text: "認証用URLの設定が不足しています。時間をおいて再度お試しください。"
    };
  }

  if (searchParams?.error) {
    return {
      tone: "error",
      text: "アカウント作成に失敗しました。時間をおいて再度お試しください。"
    };
  }

  return null;
}
