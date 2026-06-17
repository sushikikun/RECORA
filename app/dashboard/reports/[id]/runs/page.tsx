import { RunCyclePanel } from "@/components/recora/run-cycle-panel";

export default function Page({ params }: { params: { id: string } }) {
  return <RunCyclePanel projectSlug={params.id} />;
}
