// Read-only bridge to a public VITA repository: the builder can point at the
// profile repo (owner/repo/branch) and pull a fresh portfolio snapshot from
// its seed files, the same data the admin panel exports as portfolio.json.
// Everything is fetched anonymously; a public GitHub repo needs no token, and
// this app never writes anything back, so none is asked for.

import frontMatter from "front-matter";
import { safeSetItem } from "@/shared/lib";
import {
  PORTFOLIO_FORMAT,
  PORTFOLIO_VERSION,
  validatePortfolioItem,
  type PortfolioItem,
  type PortfolioPalette,
  type PortfolioSettings,
  type PortfolioSnapshot,
} from "@/shared/contract";

const CONFIG_KEY = "os_resume_repo";
const CONTENT_PREFIX = "src/content/";

/** Where a public VITA lives. No token: this side only ever reads. */
export interface RepoRef {
  owner: string;
  repo: string;
  branch: string;
}

// Seed directory per content-type id, mirroring the site's own layout
// (copied from the admin panel; the sisters share by copying, not importing).
const TYPE_DIRS: Record<string, string> = {
  experience: "experience",
  education: "education",
  awards: "awards",
  publications: "publications",
  speaking: "speaking",
  volunteering: "volunteering",
  certificates: "certificates",
  references: "references",
  interests: "interests",
  organizations: "organizations",
  projects: "projects",
  posts: "garden",
  blog: "blog",
  updates: "updates",
  books: "books",
  courses: "courses",
  trips: "travel/cities",
  countries: "travel/countries",
};

// --- config -------------------------------------------------------------------

export function loadRepoRef(): RepoRef | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const ref = JSON.parse(raw) as RepoRef;
    return ref.owner && ref.repo && ref.branch ? ref : null;
  } catch {
    return null;
  }
}

export function saveRepoRef(ref: RepoRef): void {
  safeSetItem(CONFIG_KEY, JSON.stringify(ref));
}

export function clearRepoRef(): void {
  localStorage.removeItem(CONFIG_KEY);
}

// --- fetching -----------------------------------------------------------------

async function apiJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) {
    if (res.status === 404)
      throw new Error("Repository or branch not found. The repo must be public; this app reads without a token.");
    if (res.status === 403)
      throw new Error("GitHub rate limit reached for anonymous requests. Try again in a little while.");
    throw new Error(`GitHub error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/** Raw file content straight from the branch; not metered like the REST API. */
async function rawText(ref: RepoRef, path: string): Promise<string> {
  const res = await fetch(
    `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${encodeURIComponent(ref.branch)}/${path}`
  );
  if (!res.ok) throw new Error(`Could not read ${path} from the repository (${res.status}).`);
  return res.text();
}

function typeForPath(path: string): string | null {
  const rel = path.slice(CONTENT_PREFIX.length);
  for (const [type, dir] of Object.entries(TYPE_DIRS)) {
    if (rel.startsWith(`${dir}/`) && !rel.slice(dir.length + 1).includes("/") && rel.endsWith(".md")) {
      return type;
    }
  }
  return null;
}

/** Mirror of the site loader's frontmatter mapping, so a fetched seed becomes
 *  the same item the admin's portfolio.json export would carry. */
function parseSeedFile(type: string, path: string, raw: string): PortfolioItem & Record<string, unknown> {
  const { attributes, body } = frontMatter<Record<string, unknown>>(raw);
  const slug = path.split("/").pop()!.replace(/\.md$/, "");
  const item = {
    id: (attributes.id as string | number) || slug,
    slug,
    title: attributes.title || attributes.city || attributes.name || "Untitled",
    ...attributes,
    type,
    tags: Array.isArray(attributes.tags) ? attributes.tags : [],
    body: body.replace(/\n$/, "") || "",
    postType: type === "posts" ? attributes.type : undefined,
    updateType: type === "updates" ? attributes.updateType || "note" : undefined,
  };
  // Checked here, where the fetched file can still be named.
  return validatePortfolioItem(item, type, path);
}

function isPalettePayload(value: unknown): value is PortfolioPalette {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.light === "object" && v.light !== null && typeof v.dark === "object" && v.dark !== null;
}

/**
 * Fetch the repo's seed files and assemble the same snapshot shape the admin
 * panel exports. Two API calls (branch head + tree listing); file bodies come
 * from raw.githubusercontent.com, which anonymous use doesn't meter.
 */
export async function fetchRepoSnapshot(ref: RepoRef): Promise<PortfolioSnapshot> {
  const branch = await apiJson<{ commit: { commit: { tree: { sha: string } } } }>(
    `https://api.github.com/repos/${ref.owner}/${ref.repo}/branches/${encodeURIComponent(ref.branch)}`
  );
  const tree = await apiJson<{ tree: { path: string; type: string }[]; truncated: boolean }>(
    `https://api.github.com/repos/${ref.owner}/${ref.repo}/git/trees/${branch.commit.commit.tree.sha}?recursive=1`
  );
  if (tree.truncated) {
    throw new Error("The repository tree is too large for the API to list.");
  }

  const paths = tree.tree.filter((t) => t.type === "blob").map((t) => t.path);
  const pathSet = new Set(paths);
  // A usable source must actually be a VITA: the identity seed and the
  // profile are the two files no VITA deployment can exist without.
  if (!pathSet.has("src/content/settings/site.json") || !pathSet.has("src/content/settings/profile.md")) {
    throw new Error(
      "That repository is not a set-up VITA: it must carry src/content/settings/site.json and profile.md."
    );
  }

  // Profile → settings.
  const profile = frontMatter<Record<string, unknown>>(await rawText(ref, "src/content/settings/profile.md"));
  const settings: PortfolioSettings = {
    ...profile.attributes,
    body: profile.body.replace(/\n$/, "") || "",
  } as PortfolioSettings;

  // Palette, when the site carries one.
  let palette: PortfolioPalette | undefined;
  if (pathSet.has("src/content/settings/palette.json")) {
    try {
      const parsed: unknown = JSON.parse(await rawText(ref, "src/content/settings/palette.json"));
      if (isPalettePayload(parsed)) palette = parsed;
    } catch {
      // an unreadable palette only means the builder keeps its current look
    }
  }

  // Content seeds, grouped by type.
  const content: PortfolioSnapshot["content"] = {};
  const seeds = paths
    .filter((p) => p.startsWith(CONTENT_PREFIX))
    .map((p) => ({ path: p, type: typeForPath(p) }))
    .filter((s): s is { path: string; type: string } => s.type !== null);
  const bodies = await Promise.all(seeds.map((s) => rawText(ref, s.path)));
  seeds.forEach((s, i) => {
    (content[s.type] ??= []).push(parseSeedFile(s.type, s.path, bodies[i]));
  });

  return {
    format: PORTFOLIO_FORMAT,
    version: PORTFOLIO_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    palette,
    content,
  };
}
