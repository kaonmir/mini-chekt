import SiteSubNav from "@/components/site-sub-nav";

export default function SitesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <SiteSubNav />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
