import type { Metadata } from "next";

import "@/styles/bootstrap.min.css";
import "@/styles/common.css";
import "@/styles/main.css";
import "@/styles/responsive.css";
import "@/styles/profile.css";

import FeedLayout from "@/components/feed/FeedLayout";
import Header from "@/components/feed/Header";
import MobileHeader from "@/components/feed/MobileHeader";
import MobileBottomNav from "@/components/feed/MobileBottomNav";
import ProfileView from "@/components/profile/ProfileView";

export const metadata: Metadata = {
  title: "Profile · Buddy Script",
};

export default function ProfilePage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;300;400;500;600;700;800&display=swap"
        rel="stylesheet"
        precedence="default"
      />
      <FeedLayout>
        <Header />
        <MobileHeader />
        <MobileBottomNav />
        <div className="container _custom_container">
          <ProfileView />
        </div>
      </FeedLayout>
    </>
  );
}
