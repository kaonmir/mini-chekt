import SiteSubNav from "@/components/site-sub-nav";
import { LogoutButton } from "@/components/logout-button";

export default function MonitoringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <SiteSubNav />
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header with logout button */}
        <header className="flex items-center justify-between p-4 border-b bg-background">
          <h1 className="text-xl font-semibold">Site Management</h1>
          <LogoutButton />
        </header>
        {/* Main content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
