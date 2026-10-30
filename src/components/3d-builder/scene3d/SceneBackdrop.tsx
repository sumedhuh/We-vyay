import { useMemo } from "react";
import * as THREE from "three";
import { ROOM, themeById } from "../scene/data";
import { useSceneStore } from "../scene/store";

function makeBackdrop(themeId: string) {
  const theme = themeById(themeId);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 700;
  const ctx = canvas.getContext("2d")!;

  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.68, theme.skyBottom);
  sky.addColorStop(1, theme.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Quiet sun / moon anchor. This gives every theme a horizon and depth.
  ctx.fillStyle = theme.sun;
  ctx.globalAlpha = 0.78;
  ctx.beginPath();
  ctx.arc(canvas.width * 0.76, canvas.height * 0.3, 82, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Soft architectural silhouettes make the room feel like a real place.
  ctx.fillStyle = theme.silhouette;
  const buildings = [
    [0, 520, 160, 180], [145, 470, 105, 230], [238, 535, 150, 165],
    [370, 445, 125, 255], [482, 500, 180, 200], [645, 460, 115, 240],
    [748, 515, 180, 185], [910, 455, 115, 245], [1005, 515, 195, 185],
  ];
  buildings.forEach(([x, y, w, h], i) => {
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = `${theme.sun}22`;
    for (let wx = x + 18; wx < x + w - 10; wx += 28) {
      for (let wy = y + 20; wy < y + h - 12; wy += 34) {
        if ((wx + wy + i) % 3 !== 0) ctx.fillRect(wx, wy, 8, 11);
      }
    }
    ctx.fillStyle = theme.silhouette;
  });

  // horizon line and a simple roof plane at the top of the view.
  ctx.fillStyle = `${theme.silhouette}cc`;
  ctx.fillRect(0, 590, canvas.width, 110);
  ctx.strokeStyle = `${theme.sun}55`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 588);
  ctx.lineTo(canvas.width, 588);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function SceneBackdrop() {
  const activeTheme = useSceneStore((s) => s.activeTheme);
  const texture = useMemo(() => makeBackdrop(activeTheme), [activeTheme]);
  return (
    <group>
      {/* Full back wall screen */}
      <mesh position={[0, ROOM.height / 2, -ROOM.half + 0.035]}>
        <planeGeometry args={[ROOM.half * 2, ROOM.height]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* Side walls borrow the same environment, creating a continuous surround */}
      <mesh position={[-ROOM.half + 0.035, ROOM.height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM.half * 2, ROOM.height]} />
        <meshBasicMaterial map={texture} transparent opacity={0.28} toneMapped={false} />
      </mesh>
      <mesh position={[ROOM.half - 0.035, ROOM.height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM.half * 2, ROOM.height]} />
        <meshBasicMaterial map={texture} transparent opacity={0.28} toneMapped={false} />
      </mesh>
      {/* Roof / ceiling panel closes the black gap above the room. */}
      <mesh position={[0, ROOM.height - 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM.half * 2, ROOM.half * 2]} />
        <meshStandardMaterial color="#1a2028" roughness={0.92} metalness={0} />
      </mesh>
      <mesh position={[0, ROOM.height - 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.8, 1.1]} />
        <meshStandardMaterial color="#252c35" roughness={0.8} metalness={0.1} />
      </mesh>
    </group>
  );
}

