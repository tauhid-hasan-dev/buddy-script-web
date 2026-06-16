import type { Metadata } from "next";
import { Suspense } from "react";

import "@/styles/bootstrap.min.css";
import "@/styles/common.css";
import "@/styles/main.css";
import "@/styles/responsive.css";

import { getServerFeed } from "@/lib/server-feed";
import Spinner from "@/components/Spinner";
import Feed from "@/components/feed/Feed";
import FeedLayout from "@/components/feed/FeedLayout";
import Header from "@/components/feed/Header";
import LeftSidebar from "@/components/feed/LeftSidebar";
import MobileBottomNav from "@/components/feed/MobileBottomNav";
import MobileHeader from "@/components/feed/MobileHeader";
import RightSidebar from "@/components/feed/RightSidebar";
import Stories from "@/components/feed/Stories";

export const metadata: Metadata = {
  title: "Buddy Script",
};

function FeedFallback() {
  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b16">
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Spinner color="#377dff" />
      </div>
    </div>
  );
}

// Awaiting the feed here (rather than in the page) keeps the await behind the
// Suspense boundary, so the shell — header, sidebars, stories — paints
// instantly while the spinner shows in the feed slot until posts stream in.
async function FeedSection() {
  const initialFeed = await getServerFeed();
  return <Feed initialPage={initialFeed} />;
}

export default function FeedPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;300;400;500;600;700;800&display=swap"
        rel="stylesheet"
        precedence="default"
      />
      {/* Feed Section Start */}
      <FeedLayout>
        {/* Desktop Menu Start */}
        <Header />
        {/* Desktop Menu End */}
        {/* Mobile Menu Start */}
        <MobileHeader />
        {/* Mobile Menu End */}
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
        {/* Mobile Bottom Navigation End */}
        {/* Main Layout Structure */}
        <div className="container _custom_container">
          <div className="_layout_inner_wrap">
            <div className="row">
              {/* Left Sidebar */}
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                <LeftSidebar />
              </div>
              {/* Left Sidebar */}
              {/* Layout Middle */}
              <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                <div className="_layout_middle_wrap">
                  <div className="_layout_middle_inner">
                    <Stories />
                    <Suspense fallback={<FeedFallback />}>
                      <FeedSection />
                    </Suspense>
                  </div>
                </div>
              </div>
              {/* Layout Middle */}
              {/* Right Sidebar */}
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                <RightSidebar />
              </div>
              {/* Right Sidebar */}
            </div>
          </div>
        </div>
        {/* Main Layout Structure */}
      </FeedLayout>
      {/* Feed Section End */}
    </>
  );
}
