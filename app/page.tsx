import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar";
import { Features } from "@/components/features";
import { PageWrapper } from "@/components/page-wrapper";
import { Footer } from "@/components/ui/large-name-footer";
import { SecondPage } from "@/components/about";

export default function Home() {
  return (
    <PageWrapper>
      <main className="min-h-screen bg-white text-black flex flex-col selection:bg-black/10">
        <Navbar />
        <div className="flex-1 w-full flex flex-col">
          <Hero />
          <SecondPage />
          <Features />
        </div>
        {/* Place Footer outside flex-1 to span full width */}
        <Footer />
      </main>
    </PageWrapper>
  );
}
