import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Changelog Generator",
};

import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import { GithubConnect } from "@/components/github-connect";
import { ProtectedContent } from "@/components/protected-content";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-gray-50 border border-gray-100 text-sm p-3 px-5 rounded-xl text-gray-600 flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated
          user
        </div>
      </div>
      <div className="flex flex-col gap-6 items-start">
        <div className="flex justify-between items-center w-full">
          <h2 className="font-bold text-2xl">Dashboard</h2>
          <GithubConnect />
        </div>

        <ProtectedContent />
      </div>
    </div>
  );
}
