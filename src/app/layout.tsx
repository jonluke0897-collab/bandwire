import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Alice } from "next/font/google";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const alice = Alice({
  weight: "400",
  variable: "--font-alice",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bandwire",
  description:
    "Find your next act. Book them in minutes. The booking platform for independent venues and musicians.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${alice.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-text-primary font-body">
        <ConvexClientProvider>
          {children}
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              },
            }}
          />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
