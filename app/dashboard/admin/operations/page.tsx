import { redirect } from "next/navigation";

import { requireInternalAccess } from "@/lib/recora/internal-admin-access";

export const dynamic = "force-dynamic";

export default async function AdminOperationsPage() {
  requireInternalAccess();
  redirect("/internal/operations");
}
