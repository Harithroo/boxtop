import { TrackForm } from "@/components/TrackForm";

export const metadata = { title: "Track your order" };

export default async function Track({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return (
    <div className="container-bt py-8">
      <h1 className="h1 mb-2">Track your order</h1>
      <p className="mb-6 text-ink-muted">Enter your order number and the mobile number you ordered with.</p>
      <TrackForm order={order} />
    </div>
  );
}
