import { CmsPage, getPage } from "@/components/CmsPage";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const p = await getPage("delivery-policy"); return { title: p?.title ?? "Delivery policy" }; }
export default function Page() { return <CmsPage slug="delivery-policy" />; }
