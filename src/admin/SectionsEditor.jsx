import { ArrowDown, ArrowUp, Eye, EyeOff, Lock } from "lucide-react";
import { useContent } from "../context/ContentContext";

/** Show / hide, rename and reorder the sections of the home page (and the menu). */
export default function SectionsEditor() {
  const { content, updateAt } = useContent();
  const list = content.sections;

  const set = (next) => updateAt(["sections"], next);
  const patch = (i, p) => set(list.map((s, k) => (k === i ? { ...s, ...p } : s)));
  const move = (i, d) => {
    const j = i + d;
    // the hero ("home") always stays first
    if (i === 0 || j < 1 || j >= list.length) return;
    const a = [...list];
    [a[i], a[j]] = [a[j], a[i]];
    set(a);
  };

  return (
    <div className="adm-block">
      <h3 className="adm-block-title">Sections</h3>
      <p className="adm-help">
        The order here is the order on the page and in the menu. The menu name is what visitors see in the top bar. A hidden section is
        removed from the page and the menu, but its content is kept.
      </p>
      <ol className="adm-sections">
        {list.map((s, i) => {
          const locked = s.id === "home";
          return (
            <li key={s.id} className={s.visible ? "" : "is-hidden"}>
              <span className="adm-sec-order" aria-hidden="true">
                {i + 1}
              </span>
              <div className="adm-sec-main">
                <label htmlFor={`sec-${s.id}`}>
                  Menu name <small>({s.id})</small>
                </label>
                <input id={`sec-${s.id}`} type="text" maxLength={30} value={s.label} onChange={(e) => patch(i, { label: e.target.value })} />
              </div>
              <div className="adm-row-actions">
                {locked ? (
                  <span className="adm-locked" title="The hero always stays first and visible">
                    <Lock size={14} /> Always first
                  </span>
                ) : (
                  <>
                    <button type="button" aria-label={`Move ${s.label} up`} disabled={i <= 1} onClick={() => move(i, -1)}>
                      <ArrowUp size={15} />
                    </button>
                    <button type="button" aria-label={`Move ${s.label} down`} disabled={i === list.length - 1} onClick={() => move(i, 1)}>
                      <ArrowDown size={15} />
                    </button>
                    <button
                      type="button"
                      className={`adm-vis${s.visible ? "" : " is-off"}`}
                      aria-pressed={s.visible}
                      onClick={() => patch(i, { visible: !s.visible })}
                    >
                      {s.visible ? <Eye size={15} /> : <EyeOff size={15} />} {s.visible ? "Shown" : "Hidden"}
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
