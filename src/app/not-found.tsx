import Link from "next/link";
export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="eyebrow">Page not found</p>
        <h1 className="h1 mt-1">This box seems to be empty</h1>
        <p className="mt-2 text-ink-muted">The page may have moved. Our gift boxes are this way.</p>
        <Link href="/shop" className="btn-primary mt-6">Shop gift boxes</Link>
      </div>
    </div>
  );
}
