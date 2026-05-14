import type { ReactNode } from "react";
import Footer from "./Footer";
import Navbar from "./Navbar";

type PageLayoutProps = {
  children: ReactNode;
  mainClassName?: string;
  withFooter?: boolean;
  withNavbar?: boolean;
};

export default function PageLayout({
  children,
  mainClassName = "page-shell",
  withFooter = true,
  withNavbar = true,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      {withNavbar ? <Navbar /> : null}
      <main className={mainClassName}>{children}</main>
      {withFooter ? <Footer /> : null}
    </div>
  );
}

