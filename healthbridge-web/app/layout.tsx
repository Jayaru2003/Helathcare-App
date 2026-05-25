import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HealthBridge",
    template: "%s · HealthBridge",
  },
  description: "Modern healthcare management platform — manage appointments, patients, and prescriptions seamlessly.",
  keywords: ["healthcare", "appointments", "patients", "medical", "EMR"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%230ea5e9'/><path d='M16 7v18M7 16h18' stroke='white' stroke-width='3.5' stroke-linecap='round'/></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
