import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ADS, WALLPAPERS, wallpaperDef, wallItemDef, type ScreenConfig } from "../scene/data";

/* ---------- procedural canvas textures ---------- */

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d")! };
}

function wallpaperTexture(id: string) {
  const wp = wallpaperDef(id);
  const { c, ctx } = makeCanvas(1024, 640);
  const g = ctx.createLinearGradient(0, 0, 1024, 640);
  g.addColorStop(0, wp.from);
  g.addColorStop(1, wp.to);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 640);

  // soft glow orbs
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 640;
    const r = 40 + Math.random() * 150;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `${wp.accent}33`);
    rg.addColorStop(1, "transparent");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // diagonal accent stripes
  ctx.strokeStyle = `${wp.accent}22`;
  ctx.lineWidth = 3;
  for (let x = -640; x < 1024; x += 46) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 400, 640);
    ctx.stroke();
  }
  // brand mark
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.font = "900 74px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("MOTIONLAB", 512, 560);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function adTexture(adId: string, frame: number) {
  const ad = ADS.find((a) => a.id === adId) ?? ADS[0];
  const { c, ctx } = makeCanvas(1024, 640);
  const g = ctx.createLinearGradient(0, 0, 1024, 640);
  g.addColorStop(0, ad.from);
  g.addColorStop(1, ad.to);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 640);

  // animated sweep
  const sweep = (frame * 0.012) % 1.4 - 0.2;
  const sg = ctx.createLinearGradient(sweep * 1024 - 200, 0, sweep * 1024 + 200, 640);
  sg.addColorStop(0, "rgba(255,255,255,0)");
  sg.addColorStop(0.5, "rgba(255,255,255,0.16)");
  sg.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, 1024, 640);

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.font = "900 32px system-ui, sans-serif";
  ctx.fillText(ad.brand, 512, 130);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 86px system-ui, sans-serif";
  const words = ad.headline.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > 15) { lines.push(line.trim()); line = w; }
    else line += " " + w;
  }
  if (line.trim()) lines.push(line.trim());
  lines.forEach((l, i) => ctx.fillText(l, 512, 260 + i * 96));

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "600 34px system-ui, sans-serif";
  ctx.fillText(ad.sub, 512, 500);

  // CTA pill (roundRect isn't universal, so fall back to a plain rect)
  const pw = 260;
  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(512 - pw / 2, 540, pw, 62, 31);
  } else {
    ctx.rect(512 - pw / 2, 540, pw, 62);
  }
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 28px system-ui, sans-serif";
  ctx.fillText(ad.cta, 512, 580);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- uploaded image ---------- */

function useUploadedTexture(dataUrl?: string) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!dataUrl) { setTex(null); return; }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const t = new THREE.Texture(img);
      t.needsUpdate = true;
      t.colorSpace = THREE.SRGBColorSpace;
      setTex(t);
    };
    img.src = dataUrl;
    return () => { cancelled = true; };
  }, [dataUrl]);
  return tex;
}

/* ---------- the screen ---------- */

export default function ScreenMesh({ kind, config }: { kind: string; config?: ScreenConfig }) {
  const def = wallItemDef(kind);
  const w = def?.width ?? 1.6;
  const h = def?.height ?? 0.95;
  const frameCol = def?.frame ?? "#0b0e14";
  const isMirror = kind === "mirrorwall";

  const cfg: ScreenConfig = config ?? { source: "wallpaper", wallpaperId: WALLPAPERS[0].id };
  const uploaded = useUploadedTexture(cfg.source === "upload" ? cfg.dataUrl : undefined);
  const frameCount = useRef(0);

  const wallTex = useMemo(() => (cfg.source === "wallpaper" ? wallpaperTexture(cfg.wallpaperId ?? "aurora") : null), [cfg.source, cfg.wallpaperId]);
  const adTex = useMemo(() => (cfg.source === "ad" ? adTexture(cfg.adId ?? ADS[0].id, 0) : null), [cfg.source, cfg.adId]);

  // re-draw the ad canvas a few times a second so the sweep animates
  useFrame(() => {
    if (cfg.source !== "ad" || !adTex) return;
    frameCount.current++;
    if (frameCount.current % 8 !== 0) return;
    const next = adTexture(cfg.adId ?? ADS[0].id, frameCount.current);
    adTex.image = next.image;
    adTex.needsUpdate = true;
    next.dispose();
  });

  useEffect(() => () => { wallTex?.dispose(); adTex?.dispose(); }, [wallTex, adTex]);

  const active = uploaded ?? wallTex ?? adTex;

  return (
    <group>
      {/* bezel / frame */}
      <mesh castShadow>
        <boxGeometry args={[w + 0.09, h + 0.09, 0.075]} />
        <meshStandardMaterial color={frameCol} roughness={0.45} metalness={0.35} />
      </mesh>

      {isMirror ? (
        <mesh position={[0, 0, 0.042]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#dbeafe" metalness={0.96} roughness={0.05} />
        </mesh>
      ) : (
        <>
          {/* display surface */}
          <mesh position={[0, 0, 0.042]}>
            <planeGeometry args={[w, h]} />
            {active ? (
              <meshBasicMaterial map={active} toneMapped={false} />
            ) : (
              <meshBasicMaterial color="#0f172a" toneMapped={false} />
            )}
          </mesh>
          {/* screen glow */}
          <mesh position={[0, 0, 0.05]}>
            <planeGeometry args={[w * 0.96, h * 0.94]} />
            <meshBasicMaterial color={active ? "#ffffff" : "#1e293b"} transparent opacity={0.07} toneMapped={false} />
          </mesh>
        </>
      )}
      {/* standby LED */}
      {!isMirror && (
        <mesh position={[w / 2 - 0.1, -h / 2 - 0.055, 0.045]}>
          <sphereGeometry args={[0.017, 8, 8]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

