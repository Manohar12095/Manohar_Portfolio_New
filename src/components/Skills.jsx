import { useEffect, useMemo, useRef } from "react";
import { useContent } from "../context/ContentContext";
import { prefersReducedMotion } from "../hooks/useMotion";

/** A draggable 3D sphere of skills (plain DOM + math, no WebGL needed). */
function SkillSphere({ skillGroups }) {
  const wrap = useRef(null);
  const els = useRef([]);

  const flat = useMemo(
    () => skillGroups.flatMap((g) => g.items.map((name) => ({ name, color: g.color }))),
    [skillGroups]
  );

  // spread points evenly over a sphere (Fibonacci lattice)
  const pts = useMemo(() => {
    const n = flat.length;
    return flat.map((_, i) => {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = Math.PI * (3 - Math.sqrt(5)) * i;
      return { x: Math.cos(th) * r, y, z: Math.sin(th) * r };
    });
  }, [flat]);

  useEffect(() => {
    const root = wrap.current;
    if (!root) return;
    const reduced = prefersReducedMotion();
    const rot = { x: 0.35, y: 0 };
    const vel = { x: 0, y: reduced ? 0 : 0.0035 };
    let dragging = false;
    let last = { x: 0, y: 0 };
    let hover = false;
    let raf;

    const draw = () => {
      const R = root.clientWidth * 0.4;
      const cx = Math.cos(rot.x), sx = Math.sin(rot.x);
      const cy = Math.cos(rot.y), sy = Math.sin(rot.y);
      pts.forEach((p, i) => {
        const el = els.current[i];
        if (!el) return;
        const y1 = p.y * cx - p.z * sx;
        const z1 = p.y * sx + p.z * cx;
        const x2 = p.x * cy + z1 * sy;
        const z2 = -p.x * sy + z1 * cy;
        const depth = (z2 + 1) / 2; // 0 = back, 1 = front
        el.style.transform = `translate(-50%,-50%) translate(${x2 * R}px, ${y1 * R}px) scale(${0.62 + depth * 0.55})`;
        el.style.opacity = String(0.28 + depth * 0.72);
        el.style.zIndex = String(Math.round(depth * 100));
      });
    };

    const tick = () => {
      if (!dragging) {
        const base = reduced ? 0 : hover ? 0.0009 : 0.0035;
        vel.y += (base - vel.y) * 0.04;
        vel.x += (0 - vel.x) * 0.04;
      }
      rot.x += vel.x;
      rot.y += vel.y;
      draw();
      raf = requestAnimationFrame(tick);
    };

    const down = (e) => {
      dragging = true;
      last = { x: e.clientX, y: e.clientY };
      root.setPointerCapture?.(e.pointerId);
      root.classList.add("is-drag");
    };
    const move = (e) => {
      if (!dragging) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      vel.y = dx * 0.006;
      vel.x = -dy * 0.006;
      rot.y += dx * 0.006;
      rot.x = Math.max(-1.2, Math.min(1.2, rot.x - dy * 0.006));
    };
    const up = () => {
      dragging = false;
      root.classList.remove("is-drag");
    };

    root.addEventListener("pointerdown", down);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerup", up);
    root.addEventListener("pointercancel", up);
    root.addEventListener("pointerenter", () => (hover = true));
    root.addEventListener("pointerleave", () => (hover = false));

    if (reduced) {
      draw();
      // still redraw after drags
      raf = requestAnimationFrame(tick);
    } else {
      raf = requestAnimationFrame(tick);
    }
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerup", up);
      root.removeEventListener("pointercancel", up);
    };
  }, [pts]);

  return (
    <div className="sphere" ref={wrap} aria-hidden="true">
      <div className="sphere-core" />
      {flat.map((s, i) => (
        <span key={`${s.name}-${i}`} ref={(el) => (els.current[i] = el)} className="sphere-tag" style={{ "--c": s.color }}>
          {s.name}
        </span>
      ))}
    </div>
  );
}

export default function Skills() {
  const {
    content: { skillGroups, skills },
  } = useContent();
  return (
    <section id="skills" className="section container">
      <div className="section-head">
        <h2>{skills.heading}</h2>
        <p>{skills.intro}</p>
      </div>
      <div className="skills-grid">
        <SkillSphere skillGroups={skillGroups} />
        <div className="skill-groups">
          {skillGroups.map((g) => (
            <div key={g.id} className="skill-group" style={{ "--c": g.color }}>
              <h3>{g.label}</h3>
              <ul className="pill-row">
                {g.items.map((s, i) => (
                  <li key={s + i} className="pill pill-c">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
