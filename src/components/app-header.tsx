import { Sprout } from "lucide-react";

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="brand-mark" aria-hidden="true">
          <Sprout size={18} strokeWidth={2.4} />
        </div>
        <div>
          <p className="eyebrow">Daily fuel</p>
          <p className="brand-name">Crux</p>
        </div>
      </div>
    </header>
  );
}
