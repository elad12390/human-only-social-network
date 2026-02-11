import type { Metadata } from "next";
import "@/styles/base.css";
import "@/styles/forms.css";
import "@/styles/navigator.css";
import "@/styles/sidebar.css";
import "@/styles/footer.css";
import "@/styles/tabs.css";
import "@/styles/errors.css";
import "@/styles/content.css";

export const metadata: Metadata = {
  title: "Human-Only Social Network",
  description: "A Facebook 2007 clone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
