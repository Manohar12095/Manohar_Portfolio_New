import { useCallback, useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity, Award, Briefcase, Cpu, Database, ExternalLink, FolderKanban, Image, LayoutList, Lock, Mail, Palette, Route, RotateCcw, Save, Settings, Shield, Sparkles, Trophy, User, Users,
} from "lucide-react";
import { useContent } from "../context/ContentContext";
import { getIn } from "../lib/shape";
import { getAdapter } from "../data/store";
import { endSession, isSessionActive, touchSession } from "./auth";
import { ObjectsField, SchemaForm } from "./fields";
import { TABS } from "./schemas";
import Gate from "./Gate";
import SectionsEditor from "./SectionsEditor";
import ThemesTab from "./ThemeEditor";
import DataTools from "./DataTools";
import MediaTab from "./MediaLibrary";
import MonitoringTab from "./MonitoringTab";
import CertificatesTab from "./CertificatesTab";
import PersonalSpaceTab from "./PersonalSpaceTab";
import UsersTab from "./UsersTab";
import UserControlTab from "./UserControlTab";
import "./admin.css";

const ICONS = {
  settings: Settings, layout: LayoutList, sparkles: Sparkles, user: User, route: Route, briefcase: Briefcase, folder: FolderKanban,
  cpu: Cpu, trophy: Trophy, mail: Mail, palette: Palette, database: Database, image: Image, activity: Activity,
  award: Award, lock: Lock, users: Users, shield: Shield,
};

/** One editable part of the content (an object's fields, or a list of cards). */
function Block({ block }) {
  const { content, updateAt } = useContent();
  const value = getIn(content, block.path);
  const onChange = (v) => updateAt(block.path, v);
  return (
    <section className="adm-block" aria-label={block.title}>
      <h3 className="adm-block-title">{block.title}</h3>
      {block.list ? <ObjectsField field={block.list} value={value} onChange={onChange} /> : <SchemaForm fields={block.fields} value={value} onChange={onChange} />}
    </section>
  );
}

function Status({ dirty, status }) {
  let cls = "is-idle";
  let text = "No unsaved changes";
  if (status.state === "saving") (cls = "is-busy"), (text = "Saving…");
  else if (status.state === "error") (cls = "is-error"), (text = status.msg);
  else if (dirty) (cls = "is-dirty"), (text = "Unsaved changes");
  else if (status.state === "saved") (cls = "is-saved"), (text = "All changes saved");
  return (
    <span className={`adm-status ${cls}`} role="status" aria-live="polite">
      <i aria-hidden="true" /> {text}
    </span>
  );
}

function Shell({ onLock }) {
  const { dirty, status, save, discard } = useContent();
  const { hash } = useLocation();
  const [epoch, setEpoch] = useState(0); // bumping this re-creates the editors after Discard
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [userRole, setUserRole] = useState("superuser");
  const [userEmail, setUserEmail] = useState("");

  const adapter = getAdapter();
  const supabase = adapter?.supabase;

  // Determine user role from Supabase session & admin_roles
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data }) => {
      const email = data?.session?.user?.email?.toLowerCase();
      if (email) {
        setUserEmail(email);
        if (email === "manoharorignal@gmail.com" || email === "pvcmanohar@gmail.com") {
          setUserRole("superuser");
        } else {
          try {
            const { data: roleData } = await supabase
              .from("admin_roles")
              .select("role")
              .eq("email", email)
              .maybeSingle();
            if (roleData?.role) {
              setUserRole(roleData.role);
            } else {
              setUserRole("viewer");
            }
          } catch {
            setUserRole("viewer");
          }
        }
      }
    });
  }, [supabase]);

  // Filter tabs by role: Editors & Viewers cannot enter personal space or user control
  const accessibleTabs = useMemo(() => {
    return TABS.filter((t) => {
      if (userRole === "editor" || userRole === "viewer") {
        if (t.id === "personal" || t.id === "userControl") return false;
      }
      return true;
    });
  }, [userRole]);

  const tab = accessibleTabs.find((t) => `#${t.id}` === hash) || accessibleTabs[0] || TABS[0];

  // keep the page title and search engines out of the admin
  useEffect(() => {
    const prev = document.title;
    document.title = "Admin · Portfolio";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => {
      document.title = prev;
      meta.remove();
    };
  }, []);

  // leaving with unsaved work asks first
  useEffect(() => {
    if (!dirty) return;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  // lock after 30 idle minutes
  useEffect(() => {
    const touch = () => touchSession();
    const events = ["pointerdown", "keydown"];
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const timer = setInterval(() => {
      if (!isSessionActive()) onLock();
    }, 20000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      clearInterval(timer);
    };
  }, [onLock]);

  // Ctrl/Cmd + S
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (userRole !== "viewer") save();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [save, userRole]);

  // jump to the top when changing tab
  useEffect(() => {
    window.scrollTo(0, 0);
    setConfirmDiscard(false);
  }, [tab.id]);

  const doDiscard = async () => {
    await discard();
    setEpoch((n) => n + 1);
    setConfirmDiscard(false);
  };

  let body;
  if (tab.custom === "sections") body = <SectionsEditor />;
  else if (tab.custom === "themes") body = <ThemesTab />;
  else if (tab.custom === "data") body = <DataTools />;
  else if (tab.custom === "media") body = <MediaTab />;
  else if (tab.custom === "monitoring") body = <MonitoringTab />;
  else if (tab.custom === "certificates") body = <CertificatesTab />;
  else if (tab.custom === "personal") body = <PersonalSpaceTab currentUserEmail={userEmail} currentUserRole={userRole} />;
  else if (tab.custom === "users") body = <UsersTab currentUserEmail={userEmail} currentUserRole={userRole} />;
  else if (tab.custom === "userControl") body = <UserControlTab currentUserEmail={userEmail} currentUserRole={userRole} />;
  else body = tab.blocks.map((b) => <Block key={b.title} block={b} />);

  const isViewer = userRole === "viewer";

  return (
    <div className="adm-shell">
      <a className="skip" href="#adm-main">
        Skip to editor
      </a>
      <header className="adm-top">
        <div className="adm-top-left">
          <strong className="adm-brand">Portfolio admin</strong>
          <span className={`adm-role-tag is-${userRole}`}>
            {userRole === "superuser" ? "Super User" : userRole === "editor" ? "Editor" : "Viewer (Read-Only)"}
          </span>
          <Status dirty={dirty} status={status} />
        </div>
        <div className="adm-top-actions">
          <Link to="/" className="adm-btn adm-btn-sm">
            <ExternalLink size={15} /> View site
          </Link>
          {confirmDiscard ? (
            <>
              <button type="button" className="adm-btn adm-btn-sm adm-btn-danger" onClick={doDiscard}>
                Yes, discard
              </button>
              <button type="button" className="adm-btn adm-btn-sm" onClick={() => setConfirmDiscard(false)}>
                Keep editing
              </button>
            </>
          ) : (
            <button type="button" className="adm-btn adm-btn-sm" disabled={!dirty || isViewer} onClick={() => setConfirmDiscard(true)}>
              <RotateCcw size={15} /> Discard
            </button>
          )}
          <button
            type="button"
            className="adm-btn adm-btn-primary adm-btn-sm"
            disabled={!dirty || status.state === "saving" || isViewer}
            onClick={save}
            title={isViewer ? "Viewer mode - editing disabled" : "Ctrl + S"}
          >
            <Save size={15} /> Save
          </button>
          <button type="button" className="adm-btn adm-btn-sm" onClick={onLock}>
            <Lock size={15} /> Lock
          </button>
        </div>
      </header>

      {dirty && !isViewer && (
        <div className="adm-savebar" role="region" aria-label="Unsaved changes">
          <span>Unsaved changes</span>
          <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={save} disabled={status.state === "saving"}>
            <Save size={15} /> Save
          </button>
        </div>
      )}

      <div className="adm-layout">
        <nav className="adm-nav" aria-label="Admin sections">
          {accessibleTabs.map((t) => {
            const Icon = ICONS[t.icon] || Settings;
            const on = t.id === tab.id;
            return (
              <Link key={t.id} to={`/admin#${t.id}`} className={on ? "is-on" : ""} aria-current={on ? "page" : undefined}>
                <Icon size={17} aria-hidden="true" /> <span>{t.label}</span>
              </Link>
            );
          })}
        </nav>

        <main id="adm-main" className="adm-main" tabIndex={-1}>
          <div className="adm-main-head">
            <h2>{tab.label}</h2>
            <p>{tab.blurb}</p>
          </div>
          <div key={`${tab.id}-${epoch}`} className="adm-tab">
            {body}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const [unlocked, setUnlocked] = useState(() => isSessionActive());
  const lock = useCallback(() => {
    endSession();
    setUnlocked(false);
  }, []);

  // the gate also keeps the tab title neutral and out of search results
  useEffect(() => {
    if (unlocked) return;
    const prev = document.title;
    document.title = "Admin sign in";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => {
      document.title = prev;
      meta.remove();
    };
  }, [unlocked]);

  return (
    <div className="adm" data-adm>
      {unlocked ? <Shell onLock={lock} /> : <Gate onUnlock={() => setUnlocked(true)} />}
    </div>
  );
}
