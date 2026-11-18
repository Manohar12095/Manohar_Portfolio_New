import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { prefersReducedMotion } from "../hooks/useMotion";
import { useContent } from "../context/ContentContext";

/* ----------------------------------------------------------------------------
   THE 3D SCENE
   A fixed WebGL canvas sits behind the whole page.
   • As you scroll, the camera travels down through a field of glass shapes.
   • The mouse gently shifts the camera (parallax).
   • In the hero, a halo of rings + satellites locks onto the photo card
     (the element with id="hero-photo") so it works on any screen size.
   • Colours, on/off and density come from the active THEME (Admin → Themes).
   Tweak the numbers in CONFIG to change the feel.
   -------------------------------------------------------------------------- */

const CONFIG = {
  travel: 24, // how far (world units) the camera moves from top to bottom of the page
  shapeCountDesktop: 18,
  shapeCountMobile: 9,
  particles: 180,
  ghostCount: 9, // faint wireframes far behind the content
  density: { low: 0.6, normal: 1, high: 1.5 },
};

const input = { p: 0, mx: 0, my: 0 }; // scroll progress 0..1 and mouse -1..1

function rng(seed) {
  // tiny deterministic random generator so the layout is the same on every visit
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KINDS = ["ico", "oct", "torus", "knot", "box", "sphere", "dodeca"];
const GHOST_KINDS = ["ico", "oct", "box", "dodeca"]; // sparse line drawings only

function Geometry({ kind }) {
  switch (kind) {
    case "ico":
      return <icosahedronGeometry args={[1, 0]} />;
    case "oct":
      return <octahedronGeometry args={[1, 0]} />;
    case "torus":
      return <torusGeometry args={[1, 0.34, 18, 48]} />;
    case "knot":
      return <torusKnotGeometry args={[0.75, 0.24, 96, 14]} />;
    case "box":
      return <boxGeometry args={[1.3, 1.3, 1.3]} />;
    case "dodeca":
      return <dodecahedronGeometry args={[1, 0]} />;
    default:
      return <sphereGeometry args={[0.85, 32, 32]} />;
  }
}

/** Rough brightness (0 = black, 1 = white) of a #rrggbb colour. */
function luma(hex) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  if (!Number.isFinite(n)) return 0.5;
  const f = (v) => ((v / 255) <= 0.03928 ? v / 255 / 12.92 : (((v / 255) + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
}

function Shape({ s, reduced }) {
  const ref = useRef();
  useFrame((state, dt) => {
    if (reduced || !ref.current) return;
    const m = ref.current;
    m.rotation.x += dt * s.rot[0];
    m.rotation.y += dt * s.rot[1];
    m.position.y = s.pos[1] + Math.sin(state.clock.elapsedTime * s.speed + s.phase) * 0.25;
  });
  return (
    <mesh ref={ref} position={s.pos} scale={s.scale} rotation={s.rotation}>
      <Geometry kind={s.kind} />
      {s.wire ? (
        <meshBasicMaterial color={s.color} wireframe transparent opacity={s.ghost ? s.opacity : 0.26} />
      ) : (
        <meshPhysicalMaterial
          color={s.color}
          emissive={s.color}
          emissiveIntensity={0.32}
          roughness={0.2}
          metalness={0.02}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transparent
          opacity={0.78}
        />
      )}
    </mesh>
  );
}

function ShapeField({ reduced, palette, density, accent }) {
  const viewport = useThree((s) => s.viewport);
  const size = useThree((s) => s.size);
  const mobile = size.width < 820;
  const halfW = viewport.width / 2;
  const paletteKey = palette.join(",");

  const shapes = useMemo(() => {
    const rand = rng(2026);
    const mult = CONFIG.density[density] ?? 1;
    const count = Math.max(4, Math.round((mobile ? CONFIG.shapeCountMobile : CONFIG.shapeCountDesktop) * mult));
    const pick = () => palette[Math.floor(rand() * palette.length)];
    const solid = Array.from({ length: count }, (_, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const z = -6 + rand() * 6;
      // half the visible width at this depth (things further back look closer to the middle)
      const edge = (halfW * (10 - z)) / 10;
      // keep the solid shapes in the side margins so they never sit behind text
      const x = side * edge * (mobile ? 1.18 : 0.98 + rand() * 0.25); // on phones push them mostly off-screen
      const y = 1.2 - (i / count) * (CONFIG.travel + 3) - rand() * 0.8;
      return {
        kind: KINDS[Math.floor(rand() * KINDS.length)],
        pos: [x, y, z],
        scale: mobile ? 0.35 + rand() * 0.35 : 0.55 + rand() * 0.6,
        rotation: [rand() * 3, rand() * 3, 0],
        rot: [(rand() - 0.5) * 0.5, (rand() - 0.5) * 0.6],
        speed: 0.4 + rand() * 0.6,
        phase: rand() * 6,
        color: pick(),
        wire: rand() > 0.75,
      };
    });
    // ghosts: faint wireframes far behind everything, anywhere on screen (they never hurt legibility)
    const ghostN = mobile ? 4 : CONFIG.ghostCount;
    const ghostOpacity = luma(accent) < 0.1 ? 0.04 : 0.1; // near-black / burgundy lines on a light page stay very faint
    const ghosts = Array.from({ length: ghostN }, (_, i) => {
      const z = -15 + rand() * 5;
      const edge = (halfW * (10 - z)) / 10;
      return {
        kind: GHOST_KINDS[Math.floor(rand() * GHOST_KINDS.length)],
        pos: [(rand() * 2 - 1) * edge * 0.8, 1 - (i / ghostN) * (CONFIG.travel + 3) - rand() * 2, z],
        scale: 1.2 + rand() * 1.3,
        rotation: [rand() * 3, rand() * 3, 0],
        rot: [(rand() - 0.5) * 0.25, (rand() - 0.5) * 0.3],
        speed: 0.3 + rand() * 0.3,
        phase: rand() * 6,
        color: accent,
        wire: true,
        ghost: true,
        opacity: ghostOpacity,
      };
    });
    return [...solid, ...ghosts];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile, Math.round(halfW * 10), paletteKey, density, accent]);

  return shapes.map((s, i) => <Shape key={i} s={s} reduced={reduced} />);
}

function Particles({ color, dark }) {
  const geo = useMemo(() => {
    const rand = rng(7);
    const arr = new Float32Array(CONFIG.particles * 3);
    for (let i = 0; i < CONFIG.particles; i++) {
      arr[i * 3] = (rand() - 0.5) * 26;
      arr[i * 3 + 1] = 4 - rand() * (CONFIG.travel + 8);
      arr[i * 3 + 2] = -9 + rand() * 9;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color={color} size={0.05} transparent opacity={dark ? 0.7 : 0.45} sizeAttenuation />
    </points>
  );
}

/** Moves the camera with scroll + mouse. */
function Rig({ reduced }) {
  useFrame((state, dt) => {
    const cam = state.camera;
    const k = Math.min(1, dt * (reduced ? 20 : 3));
    cam.position.y += (-input.p * CONFIG.travel - cam.position.y) * k;
    cam.position.x += ((reduced ? 0 : input.mx * 0.7) - cam.position.x) * Math.min(1, dt * 2);
    cam.lookAt(cam.position.x * 0.3, cam.position.y + (reduced ? 0 : input.my * 0.3), 0);
  });
  return null;
}

/** Rings + satellites that lock onto the hero photo card. */
function HeroHalo({ reduced, colors, palette }) {
  const group = useRef();
  const spin = useRef();
  const r1 = useRef();
  const r2 = useRef();
  const r3 = useRef();
  const viewport = useThree((s) => s.viewport);
  const camera = useThree((s) => s.camera);
  const sats = useMemo(
    () => [
      { a: 0, r: 1.0, size: 0.075, color: palette[0] },
      { a: 1.7, r: 1.12, size: 0.05, color: palette[2] },
      { a: 3.2, r: 0.94, size: 0.095, color: palette[1] },
      { a: 4.6, r: 1.08, size: 0.045, color: palette[3] },
    ],
    [palette]
  );

  useFrame((state, dt) => {
    const el = document.getElementById("hero-photo");
    const g = group.current;
    if (!g) return;
    if (!el) {
      g.visible = false;
      return;
    }
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.bottom < -50 || rect.top > vh + 50) {
      g.visible = false;
      return;
    }
    g.visible = true;
    // convert the photo card's screen position into world coordinates at z = 0
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    g.position.set((cx / vw - 0.5) * viewport.width, camera.position.y - (cy / vh - 0.5) * viewport.height, 0);
    g.scale.setScalar((rect.width / vw) * viewport.width * 0.64);

    if (!reduced) {
      const t = state.clock.elapsedTime;
      r1.current.rotation.z += dt * 0.25;
      r2.current.rotation.z -= dt * 0.18;
      r3.current.rotation.z += dt * 0.12;
      spin.current.rotation.z += dt * 0.35;
      r1.current.rotation.x = 1.15 + Math.sin(t * 0.4) * 0.08;
      r2.current.rotation.x = 1.0 + Math.cos(t * 0.3) * 0.08;
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={r1} rotation={[1.15, 0.3, 0]}>
        <torusGeometry args={[1, 0.006, 8, 160]} />
        <meshBasicMaterial color={colors.accent} transparent opacity={0.7} />
      </mesh>
      <mesh ref={r2} rotation={[1.0, -0.5, 0.6]} scale={1.16}>
        <torusGeometry args={[1, 0.005, 8, 160]} />
        <meshBasicMaterial color={colors.accent2} transparent opacity={0.6} />
      </mesh>
      <mesh ref={r3} rotation={[0.4, 0.9, 0]} scale={0.88}>
        <torusGeometry args={[1, 0.004, 8, 160]} />
        <meshBasicMaterial color={palette[1]} transparent opacity={0.55} />
      </mesh>
      <group ref={spin} rotation={[1.15, 0.3, 0]}>
        {sats.map((s, i) => (
          <mesh key={i} position={[Math.cos(s.a) * s.r, Math.sin(s.a) * s.r, 0]} scale={s.size}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshPhysicalMaterial color={s.color} emissive={s.color} emissiveIntensity={0.35} roughness={0.15} clearcoat={1} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Scene({ reduced, theme }) {
  const { palette, density } = theme.scene;
  const dark = theme.mode === "dark";
  return (
    <>
      <ambientLight intensity={dark ? 0.75 : 0.95} />
      <directionalLight position={[5, 8, 6]} intensity={dark ? 1.1 : 1.3} />
      <pointLight position={[-6, -2, 4]} intensity={18} color={theme.colors.accent2} />
      <Rig reduced={reduced} />
      <ShapeField reduced={reduced} palette={palette} density={density} accent={theme.colors.accent} />
      <Particles color={dark ? theme.colors.accent2 : theme.colors.accent} dark={dark} />
      <HeroHalo reduced={reduced} colors={theme.colors} palette={palette} />
    </>
  );
}

/** If WebGL fails, the page simply shows its background instead of crashing. */
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function SceneBackground() {
  const { themes } = useContent(); // read the theme here: the Canvas below is a separate React tree
  const theme = themes.active;
  const reduced = useRef(prefersReducedMotion()).current;
  const ok = useMemo(() => webglAvailable(), []);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      input.p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    const onMove = (e) => {
      input.mx = (e.clientX / window.innerWidth - 0.5) * 2;
      input.my = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  if (!ok || theme.scene.enabled === false) return null;
  return (
    <div className="scene" aria-hidden="true">
      <SceneBoundary>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 10], fov: 40, near: 0.1, far: 60 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <Scene reduced={reduced} theme={theme} />
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
