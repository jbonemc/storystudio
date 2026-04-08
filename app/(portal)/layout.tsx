import { PortalNav } from "@/components/portal/PortalNav";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <PortalNav />
      {children}
      <footer className="text-center text-xs text-gray-300 py-8 border-t border-gray-100">
        Story Studio by Whipsmart Media &middot; storystudiocourse.com
      </footer>
    </div>
  );
}
