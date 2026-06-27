import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Mail } from "lucide-react";

import { sendRecoraPasswordReset } from "./actions";

type ForgotPasswordPageProps = {
  searchParams?: {
    error?: string;
    sent?: string;
  };
};

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage({ searchParams = {} }: ForgotPasswordPageProps) {
  const message = getForgotPasswordMessage(searchParams);

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
              <p className="text-sm font-bold text-[#D8F36A]">パスワード再設定</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight tracking-normal sm:text-4xl">
                パスワードを再設定する
              </h1>
              <p className="mt-4 text-base leading-7 text-white/78">
                登録済みのメールアドレスに、パスワード再設定用のリンクを送信します。
              </p>
            </div>
          </div>

          <div className="px-6 py-7 sm:px-8 sm:py-9">
            {message ? <AuthMessage message={message} /> : null}

            <form action={sendRecoraPasswordReset} className="mt-6 space-y-5">
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
              <button
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#00796B] px-5 text-base font-bold text-white shadow-sm shadow-teal-900/10 transition hover:bg-[#005C50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00796B] focus-visible:ring-offset-2"
                type="submit"
              >
                再設定メールを送信
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-3 border-t border-[#E8F0ED] pt-5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span>パスワードを思い出した方</span>
              <Link className="font-bold text-[#00796B] hover:text-[#005C50]" href="/login">
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

function getForgotPasswordMessage(searchParams: ForgotPasswordPageProps["searchParams"]): AuthMessageData | null {
  if (searchParams?.sent) {
    return {
      tone: "success",
      text: "パスワード再設定メールを送信しました。"
    };
  }

  if (searchParams?.error === "session") {
    return {
      tone: "error",
      text: "再設定用リンクの有効期限が切れたか、セッションを確認できませんでした。再設定メールを再送してください。"
    };
  }

  if (searchParams?.error === "invalid") {
    return {
      tone: "error",
      text: "メールアドレスを入力してください。"
    };
  }

  if (searchParams?.error === "config") {
    return {
      tone: "error",
      text: "Supabaseの認証設定が不足しています。"
    };
  }

  if (searchParams?.error) {
    return {
      tone: "error",
      text: "再設定メールを送信できませんでした。時間をおいて再度お試しください。"
    };
  }

  return null;
}
