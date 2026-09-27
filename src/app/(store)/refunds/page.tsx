import { CmsPage, getPage } from "@/components/CmsPage";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const p = await getPage("refunds"); return { title: p?.title ?? "Refunds" }; }
export default function Page() { return <CmsPage slug="refunds" />; }
