import type { Metadata } from "next";
import "@/styles/base.css";
import "@/styles/forms.css";
import "@/styles/navigator.css";
import "@/styles/sidebar.css";
import "@/styles/footer.css";
import "@/styles/tabs.css";
import "@/styles/errors.css";
import "@/styles/content.css";
import "@/styles/welcome.css";
import "@/styles/profile.css";
import "@/styles/friends.css";
import "@/styles/feed.css";
import "@/styles/photos.css";
import "@/styles/messages.css";
import "@/styles/groups.css";
import Navigator from "@/components/Navigator";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

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
        <div id="book">
          <Sidebar />
          <div id="widebar">
            <Navigator />
            <div id="page_body">
              <div id="content_shadow">
                <div id="content">
                  {children}
                </div>
              </div>
            </div>
          </div>
          <Footer />
          <div className="clearfix"></div>
        </div>
      </body>
    </html>
  );
}
