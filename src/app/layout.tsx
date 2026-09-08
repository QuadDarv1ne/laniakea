import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ланиакея — интерактивная 3D-карта сверхскопления",
  description:
    "Интерактивная 3D-карта сверхскопления галактик Ланиакея: Млечный Путь, Великий аттрактор, Гидра-Центавр, Павлин-Индеец и Южное сверхскопление.",
  keywords: [
    "Ланиакея",
    "Laniakea",
    "сверхскопление",
    "Великий аттрактор",
    "Млечный Путь",
    "галактики",
    "3D карта",
    "астрономия",
  ],
  authors: [{ name: "Источник: prokosmos.ru, naked-science.ru" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Ланиакея — интерактивная 3D-карта",
    description:
      "Сверхскопление галактик, в котором находится наша Галактика, в 3D.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
