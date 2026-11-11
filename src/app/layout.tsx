import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Onboarding from "@/components/Onboarding";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "N-marke — Le marché en ligne des Comores",
  description:
    "Achète, vends et fais-toi livrer par moto partout aux Comores. N-marke, c'est le marché en ligne simple, humain et chaleureux.",
  applicationName: "N-marke",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "N-marke",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "N-marke — Le marché en ligne des Comores",
    description: "Achète, vends et fais-toi livrer par moto partout aux Comores.",
    type: "website",
    locale: "fr_FR",
  },
};

export const viewport: Viewport = {
  themeColor: "#3579AC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Poppins:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Onboarding />
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}
