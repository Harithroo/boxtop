import { Listing } from "@/components/Listing";

export const metadata = { title: "All gift boxes" };

export default async function Shop({ searchParams }: { searchParams: Promise<{ budget?: string; sort?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="container-bt py-8">
      <p className="eyebrow">Shop</p>
      <h1 className="h1 mb-5">All gift boxes</h1>
      <Listing basePath="/shop" sp={sp} />
    </div>
  );
}
