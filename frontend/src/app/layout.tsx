import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { chillax } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Task Manager",
  description: "Application de gestion de tâches",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${chillax.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
