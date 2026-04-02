import type { Metadata, Viewport } from "next";
import { Geist_Mono, Poppins, Raleway } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { FormationProvider } from "@/components/providers/formation-provider";
import { ConfirmProvider } from "@/components/confirm-provider";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Formation Émargement",
  description:
    "Feuilles de présence, demi-journées et signatures — démo type Digiforma",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Émargement",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1033" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${raleway.variable} ${poppins.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <FormationProvider>
            <ConfirmProvider>
              <AppShell>{children}</AppShell>
            </ConfirmProvider>
            <Toaster
              position="top-center"
              richColors
              closeButton
              toastOptions={{
                classNames: {
                  toast:
                    "cn-toast w-[min(100vw-1.5rem,24rem)] max-w-[min(100vw-1.5rem,24rem)]",
                },
              }}
            />
          </FormationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
