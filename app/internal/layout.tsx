import type { Metadata } from "next";

import { InternalConsoleShell } from "@/components/recora/internal-console-shell";
import { requireInternalAccess } from "@/lib/recora/internal-admin-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recora 内部運用",
  description: "Recoraのローカル限定内部運用コンソール。"
};

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const access = requireInternalAccess();

  return <InternalConsoleShell access={access}>{children}</InternalConsoleShell>;
}
