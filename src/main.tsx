import { createRoot } from "react-dom/client";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/work-sans/300.css";
import "@fontsource/work-sans/400.css";
import "@fontsource/work-sans/500.css";
import "@fontsource/work-sans/600.css";
import "@fontsource/work-sans/700.css";
import "./index.css";
import { checkSupabaseEnv } from "./lib/env";
import { SetupRequired } from "./components/SetupRequired";
import { AppErrorBoundary, CrashScreen } from "./components/AppErrorBoundary";

const root = createRoot(document.getElementById("root")!);
const env = checkSupabaseEnv();

if (!env.ok) {
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
