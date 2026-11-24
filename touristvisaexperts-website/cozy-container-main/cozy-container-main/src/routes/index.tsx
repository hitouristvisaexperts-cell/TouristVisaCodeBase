import { createFileRoute } from "@tanstack/react-router";
import { PassportTestimonials } from "@/components/PassportTestimonials";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-slate-100">
      <PassportTestimonials />
    </main>
  );
}
