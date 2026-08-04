import { BuilderPage } from "@/pages/builder";
import { AppProviders } from "./providers";
import { AppLayout } from "./layout/AppLayout";

/**
 * EPITOMA is one page: the builder.
 *
 * @returns The builder inside its providers and its chrome.
 */
export function App() {
  return (
    <AppProviders>
      <AppLayout>
        <BuilderPage />
      </AppLayout>
    </AppProviders>
  );
}
