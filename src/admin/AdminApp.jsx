import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity, Briefcase, Cpu, Database, ExternalLink, FolderKanban, Image, LayoutList, Lock, Mail, Palette, Route, RotateCcw, Save, Settings, Sparkles, Trophy, User,
} from "lucide-react";
import { useContent } from "../context/ContentContext";
import { getIn } from "../lib/shape";
import { endSession, isSessionActive, touchSession } from "./auth";
import { ObjectsField, SchemaForm } from "./fields";
import { TABS } from "./schemas";
import Gate from "./Gate";
import SectionsEditor from "./SectionsEditor";
import ThemesTab from "./ThemeEditor";
import DataTools from "./DataTools";
import MediaTab from "./MediaLibrary";
import MonitoringTab from "./MonitoringTab";
import "./admin.css";

const ICONS = {
  settings: Settings, layout: LayoutList, sparkles: Sparkles, user: User, route: Route, briefcase: Briefcase, folder: FolderKanban,
  cpu: Cpu, trophy: Trophy, mail: Mail, palette: Palette, database: Database, image: Image, activity: Activity,
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

  const tab = TABS.find((t) => `#${t.id}` === hash) || TABS[0];

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
        save();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [save]);

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
  else body = tab.blocks.map((b) => <Block key={b.title} block={b} />);

  return (
    <div className="adm-shell">
      <a className="skip" href="#adm-main">
        Skip to editor
      </a>
      <header className="adm-top">
        <div className="adm-top-left">
          <strong className="adm-brand">Portfolio admin</strong>
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
            <button type="button" className="adm-btn adm-btn-sm" disabled={!dirty} onClick={() => setConfirmDiscard(true)}>
              <RotateCcw size={15} /> Discard
            </button>
          )}
          <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" disabled={!dirty || status.state === "saving"} onClick={save} title="Ctrl + S">
            <Save size={15} /> Save
          </button>
          <button type="button" className="adm-btn adm-btn-sm" onClick={onLock}>
            <Lock size={15} /> Lock
          </button>
        </div>
      </header>

      {dirty && (
        <div className="adm-savebar" role="region" aria-label="Unsaved changes">
          <span>Unsaved changes</span>
          <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={save} disabled={status.state === "saving"}>
            <Save size={15} /> Save
          </button>
        </div>
      )}

      <div className="adm-layout">
        <nav className="adm-nav" aria-label="Admin sections">
          {TABS.map((t) => {
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
