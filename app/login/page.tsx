import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, LockKeyhole, LogIn, Mail } from "lucide-react";

import { sanitizeRecoraAuthNextPath } from "@/lib/recora/auth-access";
import { loginWithRecoraPassword } from "./actions";

type LoginPageProps = {
  searchParams?: {
    error?: string;
    next?: string;
    signed_out?: string;
    updated?: string;
  };
};

export const dynamic = "force-dynamic";

export default function LoginPage({ searchParams = {} }: LoginPageProps) {
  const nextPath = sanitizeRecoraAuthNextPath(searchParams.next);
  const message = getLoginMessage(searchParams);

  return (
    <main className="min-h-screen bg-[#F6FAF9] px-5 py-8 text-slate-950 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center">
        <section className="grid w-full overflow-hidden rounded-lg border border-[#DDE8E5] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] md:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-[#073D36] px-6 py-7 text-white sm:px-8 sm:py-9">
            <Link className="inline-flex items-center gap-2 text-sm font-bold" href="/">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#D8F36A] text-[#073D36]">
                R
              </span>
              Recora
            </Link>
            <div className="mt-12 max-w-sm">
              <p className="text-sm font-bold text-[#D8F36A]">Recora workspace</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight tracking-normal sm:text-4xl">ログイン</h1>
              <p className="mt-4 text-base leading-7 text-white/78">
                登録済みのメールアドレスとパスワードでログインしてください。
              </p>
            </div>
          </div>

          <div className="px-6 py-7 sm:px-8 sm:py-9">
            {message ? <AuthMessage message={message} /> : null}

            <form action={loginWithRecoraPassword} className="mt-6 space-y-5">
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
                    autoComplete="current-password"
                    placeholder="パスワード"
                    required
                  />
                </span>
              </label>
              <button
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#00796B] px-5 text-base font-bold text-white shadow-sm shadow-teal-900/10 transition hover:bg-[#005C50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2"
                type="submit"
              >
                <LogIn className="h-4 w-4" />
                ログインする
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-3 border-t border-[#E8F0ED] pt-5 text-sm text-slate-600">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>初めての方は無料診断をはじめる</span>
                <Link className="font-bold text-[#00796B] hover:text-[#005C50]" href={`/signup?next=${encodeURIComponent(nextPath)}`}>
                  アカウントを作成
                </Link>
              </div>
              <Link className="font-bold text-[#00796B] hover:text-[#005C50]" href="/forgot-password">
                パスワードを忘れた方
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

function getLoginMessage(searchParams: LoginPageProps["searchParams"]): AuthMessageData | null {
  if (searchParams?.signed_out) {
    return {
      tone: "success",
      text: "ログアウトしました。"
    };
  }

  if (searchParams?.updated) {
    return {
      tone: "success",
      text: "パスワードを更新しました。新しいパスワードでログインしてください。"
    };
  }

  if (searchParams?.error === "config") {
    return {
      tone: "error",
      text: "Supabaseの認証設定が不足しています。"
    };
  }

  if (searchParams?.error === "unconfirmed") {
    return {
      tone: "error",
      text: "メール確認が完了していない可能性があります。確認メールをご確認ください。"
    };
  }

  if (searchParams?.error === "auth") {
    return {
      tone: "error",
      text: "ログインに失敗しました。時間をおいて再度お試しください。"
    };
  }

  if (searchParams?.error) {
    return {
      tone: "error",
      text: "メールアドレスとパスワードを確認してください。"
    };
  }

  return null;
}
