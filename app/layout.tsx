import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

import { getProfileActions } from "@/app/actions/auth";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "TOEIC Dictation - Nền tảng luyện nghe chép chính tả TOEIC",
  description: "Chinh phục kỳ thi TOEIC Listening bằng phương pháp nghe chép chính tả hiệu quả cho cả 4 Parts thi.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getProfileActions();

  return (
    <html lang="vi" className="h-full antialiased" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full text-slate-800`} suppressHydrationWarning>
        <div className="bg-linear-to-br from-white via-purple-50/30 to-purple-200/50 min-h-screen flex flex-col">
          <Navbar profile={profile} />
          <main className="flex-grow flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
