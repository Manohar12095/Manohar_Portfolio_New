import { Suspense, lazy, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import SceneBackground from "./components/SceneBackground";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import AdminBar from "./components/AdminBar";
import WelcomeGate from "./components/WelcomeGate";
import EditPortfolioTrigger from "./components/EditPortfolioTrigger";
import Home from "./pages/Home";
import JourneyDetail from "./pages/JourneyDetail";
import Certificates from "./pages/Certificates";
import PersonalSpace from "./pages/PersonalSpace";
import { prefersReducedMotion } from "./hooks/useMotion";
import { useContent } from "./context/ContentContext";
import { getStoredVisitorName, initTelemetryTracking } from "./lib/telemetry";
import { checkVisitorBlockStatus } from "./lib/blocking";
import BlockedScreen from "./components/BlockedScreen";

// The admin is its own file, so visitors never download it.
const AdminApp = lazy(() => import("./admin/AdminApp"));

/** Scrolls to the #section in the URL, or to the top on a new page. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      // wait a tick so the page has rendered
      const t = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }, 60);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function PublicSite() {
  const [visitorName, setVisitorName] = useState(() => getStoredVisitorName());

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <SceneBackground />

      {/* Visitor Welcome Gate if name not yet entered */}
      {!visitorName && (
        <WelcomeGate onEnter={(name) => setVisitorName(name)} />
      )}

      <Nav />
      <ScrollManager />
      <div id="main" className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/journey/:slug" element={<JourneyDetail />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/personal" element={<PersonalSpace />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
      <Footer />
      <AdminBar />
      <EditPortfolioTrigger />
    </>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const { ready } = useContent();
  const [blockStatus, setBlockStatus] = useState({ isBlocked: false, blockData: null });

  const recheckBlock = async () => {
    try {
      const res = await checkVisitorBlockStatus();
      setBlockStatus(res);
      return res;
    } catch {
      return { isBlocked: false, blockData: null };
    }
  };

  useEffect(() => {
    const cleanup = initTelemetryTracking();
    recheckBlock();
    // Fast periodic polling to catch newly enforced blocks or releases
    const timer = setInterval(recheckBlock, 6000);
    return () => {
      cleanup?.();
      clearInterval(timer);
    };
  }, []);

  // with a database the saved content arrives a moment after load; browser storage is ready at once
  if (!ready) return <div className="boot" aria-busy="true" aria-label="Loading" />;

  // Enforce access block globally across entire website if active
  if (blockStatus.isBlocked) {
    return (
      <BlockedScreen
        blockData={blockStatus.blockData}
        onRecheck={recheckBlock}
      />
    );
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return (
      <Suspense fallback={<div className="adm-loading">Loading admin…</div>}>
        <AdminApp />
      </Suspense>
    );
  }
  return <PublicSite />;
}
