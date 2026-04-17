import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import GoogleAuthProvider from "@/components/GoogleAuthProvider";

export const metadata: Metadata = {
  title: "Delta Labs | Admin Portal",
  description: "Secure SaaS Administrative Interface",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <GoogleAuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
