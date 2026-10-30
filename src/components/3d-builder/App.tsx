import PushupScene from "./PushupScene";
import UIOverlay from "./UIOverlay";
import { usePushupStore } from "./store";

export default function App() {
  const uiTheme = usePushupStore((s) => s.uiTheme);
  return (
    <div data-ui-theme={uiTheme} className="relative h-screen w-screen overflow-hidden bg-white dark:bg-void text-ink dark:text-snow select-none">
      <div className="absolute inset-0">
        <PushupScene />
      </div>
      <UIOverlay />
      {/* vignette */}
      <div className="pointer-events-none absolute inset-0 z-[5] dark:opacity-100 opacity-50" style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)" }} />
    </div>
  );
}
