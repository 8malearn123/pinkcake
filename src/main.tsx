import { createRoot } from "react-dom/client";
// Instrument Serif + Work Sans (7 weights) used to be pulled in here. They are
// left over from an earlier identity — no Tailwind key and no CSS rule has
// referenced either family for some time, so they were downloading on every
// page load and rendering nowhere. Pink Cake sets in one face; see index.css.
import "./index.css";
import { checkSupabaseEnv } from "./lib/env";
import { DEMO_MODE } from "./lib/demo/config";
import { SetupRequired } from "./components/SetupRequired";
import { AppErrorBoundary, CrashScreen } from "./components/AppErrorBoundary";

const root = createRoot(document.getElementById("root")!);
const env = checkSupabaseEnv();

// In demo mode the app runs entirely on mock data, so real Supabase env isn't
// required — boot straight into the app.
if (!DEMO_MODE && !env.ok) {
  // Show an actionable setup screen instead of letting the Supabase client throw
  // at import time (which would render a blank white page).
  root.render(<SetupRequired missing={env.missing} />);
} else {
  // Import App lazily so its module graph (incl. the Supabase client) is only
  // evaluated once we know the connection is configured.
  import("./App")
    .then(({ default: App }) => {
      root.render(
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      );
    })
    .catch((error) => {
      root.render(<CrashScreen error={error as Error} />);
    });
}
