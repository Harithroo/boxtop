import { CmsPage, getPage } from "@/components/CmsPage";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const p = await getPage("privacy"); return { title: p?.title ?? "Privacy" }; }
export default function Page() { return <CmsPage slug="privacy" />; }
