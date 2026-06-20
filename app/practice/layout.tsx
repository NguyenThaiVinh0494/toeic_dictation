import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getProfileActions } from "@/app/actions/auth";

export default async function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfileActions();

  if (!profile) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "/practice";
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  return <>{children}</>;
}
