import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Pencil } from "lucide-react";
import { useContent } from "../context/ContentContext";
import { isSessionActive } from "../admin/auth";

/** A small bar that only shows to a signed-in admin while viewing the public site. */
export default function AdminBar() {
  const { dirty, save, status } = useContent();
  const { pathname } = useLocation();
  const [active, setActive] = useState(false);

  useEffect(() => setActive(isSessionActive()), [pathname]);
  if (!active) return null;

  return (
    <div className="adminbar" role="region" aria-label="Admin shortcuts">
      <Link to="/admin" className="adminbar-link">
        <Pencil size={14} /> Back to admin
      </Link>
      {dirty ? (
        <>
          <span className="adminbar-note">Previewing unsaved changes</span>
          <button className="adminbar-save" onClick={save}>
            Save
          </button>
        </>
      ) : (
        <span className="adminbar-note">{status.state === "saved" ? "Saved" : "No unsaved changes"}</span>
      )}
    </div>
  );
}
