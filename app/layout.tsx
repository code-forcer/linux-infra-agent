import type { Metadata } from "next";
import { Ubuntu, Lato } from "next/font/google";
import "./globals.css";

const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "InfraWatch AI — Autonomous Linux Infrastructure Agent",
  description:
    "Real-time Linux server monitoring, AI-powered log diagnostics, and automated infrastructure remediation. Analyze PM2, systemd, and kernel logs with intelligent root-cause analysis.",
  keywords: [
    "Linux monitoring",
    "AI diagnostics",
    "server logs",
    "PM2",
    "infrastructure",
    "DevOps",
    "log analysis",
  ],
  authors: [{ name: "InfraWatch AI" }],
  openGraph: {
    title: "InfraWatch AI — Autonomous Linux Infrastructure Agent",
    description:
      "Real-time Linux server monitoring with AI-powered diagnostics and automated remediation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ubuntu.variable} ${lato.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-text-primary">
        {children}
      </body>
    </html>
  );
}
