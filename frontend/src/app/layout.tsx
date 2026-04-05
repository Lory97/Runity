import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers";
import { ContextProvider } from "@/context/Web3Modal";
import { Navbar } from "@/components/layout/Navbar";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Runity - Move-to-Earn",
  description: "The premier Move-to-Earn DApp",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const cookies = headersList.get('cookie')

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body bg-background text-foreground">
        <ContextProvider cookies={cookies}>
          <Navbar />
          <main className="flex-1 mt-20 px-6 py-8 pb-32 md:pb-8">
            <div className="max-w-7xl mx-auto space-y-10">
              {children}
            </div>
          </main>
        </ContextProvider>
      </body>
    </html>
  );
}
