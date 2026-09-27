import { CmsPage, getPage } from "@/components/CmsPage";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const p = await getPage("terms"); return { title: p?.title ?? "Terms" }; }
export default function Page() { return <CmsPage slug="terms" />; }
