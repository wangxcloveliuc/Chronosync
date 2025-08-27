import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chronosync - Personal Task Manager",
  description: "A responsive, multi-functional To-Do List personal application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
