import { AuthButton } from "@/components/auth-button";
import { PageWrapper } from "@/components/page-wrapper";
import { ScrollText } from "lucide-react";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageWrapper>
      <main className="min-h-screen bg-white text-black flex flex-col selection:bg-black/10">
        <nav className="w-full flex items-center justify-between p-6 max-w-7xl mx-auto bg-white text-black z-50 relative">
          <div className="flex items-center gap-2 font-bold text-xl">
            <ScrollText className="w-6 h-6 fill-black/20 stroke-black" />
            <span>CHANGELOG</span>
          </div>

          <div className="flex items-center gap-4">
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </nav>

        <div className="flex-1 w-full max-w-7xl mx-auto p-6 flex flex-col">
          {children}
        </div>
      </main>
    </PageWrapper>
  );
}
