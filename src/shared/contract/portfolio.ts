// The builder's OWN copy of the portfolio.json contract: the file exported
// by the TABULARIUM admin panel and imported here as the content source. The
// sister repos keep their own copies of this contract; nothing is imported
// across the repository boundary.
// `format` + `version` keep the two sides honest across repos.
//
// Item shapes below describe only the fields this builder reads; the site's
// export carries more, which structural typing happily ignores.

/** The format name a real export carries, and the first thing checked on import. */
export const PORTFOLIO_FORMAT = "vita-portfolio";

/** The contract revision this builder was written against. */
export const PORTFOLIO_VERSION = 1;

/** The owner's profile: everything a document header can draw from. */
export interface PortfolioSettings {
  name?: string;
  role?: string;
  location?: string;
  avatar?: string;
  bio?: string;
  body?: string;
  email?: string;
  phone?: string;
  website?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  scholar?: string;
  medium?: string;
  orcid?: string;
  links?: string; // free-form: one "Label: URL" per line, any platform
  skills?: string;
  languages?: string;
  nationality?: string;
  dateOfBirth?: string;
  availability?: string;
  workMode?: string;
  declaration?: string;
}

/**
 * The fields every collection's items share.
 *
 * `id` is the only one this builder requires, because a document entry links
 * back to its source by id; everything else is optional, since the site exports
 * more than any one section reads.
 */
export interface PortfolioItem {
  id: string | number;
  title?: string;
  body?: string;
  date?: string;
  link?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
}

/** A role held somewhere, the backbone of a work history section. */
export interface PortfolioExperience extends PortfolioItem {
  company?: string;
}
/** A degree or programme, with the fields a CV education line needs. */
export interface PortfolioEducation extends PortfolioItem {
  institution?: string;
  degree?: string;
  field?: string;
  gpa?: string;
}
/** A course taken, distinguished from education by having a provider. */
export interface PortfolioCourse extends PortfolioItem {
  provider?: string;
}
/** An award, scholarship, grant, or competition placing. */
export interface PortfolioAward extends PortfolioItem {
  issuer?: string;
  amount?: string;
  awardType?: string;
}
/** A published work, carrying the venue and identifiers a citation needs. */
export interface PortfolioPublication extends PortfolioItem {
  venue?: string;
  year?: string;
  doi?: string;
  authors?: string;
}
/** A talk, panel, or appearance, with links to its artifacts. */
export interface PortfolioSpeaking extends PortfolioItem {
  event?: string;
  video?: string;
  slides?: string;
}
/** Unpaid work done for an organization. */
export interface PortfolioVolunteering extends PortfolioItem {
  organization?: string;
}
/** A certification, with the credential id that makes it checkable. */
export interface PortfolioCertificate extends PortfolioItem {
  issuer?: string;
  credentialId?: string;
  certType?: string;
}
/** A membership, professional body, or affiliation. */
export interface PortfolioOrganization extends PortfolioItem {
  role?: string;
  website?: string;
  memberType?: string;
}
/** A person willing to vouch, and how to reach them. */
export interface PortfolioReference extends PortfolioItem {
  name?: string;
  role?: string;
  organization?: string;
  relationship?: string;
  email?: string;
  phone?: string;
}
/** A project, with the role played and a short result line. */
export interface PortfolioProject extends PortfolioItem {
  role?: string;
  year?: string;
  desc?: string;
  stats?: string;
}
/** Something the owner does outside work. */
export interface PortfolioInterest extends PortfolioItem {
  category?: string;
}
/** A published article, which may live canonically elsewhere. */
export interface PortfolioBlogPost extends PortfolioItem {
  slug?: string;
  excerpt?: string;
  externalUrl?: string; // canonical home elsewhere; preferred link when set
}
/** A note from the digital garden, shorter and less finished than an article. */
export interface PortfolioGardenPost extends PortfolioItem {
  slug?: string;
  desc?: string;
}

/** The owner's chosen look, carried so the sister apps can adopt it. */
export interface PortfolioPalette {
  basedOn?: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}

/** A whole exported record: the envelope, the profile, and every collection. */
export interface PortfolioSnapshot {
  format: typeof PORTFOLIO_FORMAT;
  version: number;
  exportedAt: string;
  settings: PortfolioSettings;
  /** Optional since older exports predate it; when present, the builder
   *  adopts it as its own chrome palette. */
  palette?: PortfolioPalette;
  /** Collections keyed by the site's content-type ids ("experience", …).
   *  Items carry whatever the site exports; the builder reads the subset
   *  described by the Portfolio* interfaces above. */
  content: Partial<Record<string, (PortfolioItem & Record<string, unknown>)[]>>;
}

/**
 * Decides whether a parsed value is a portfolio export at all.
 *
 * This is the envelope check, run before a snapshot is stored and again on
 * every read. It deliberately stops at the envelope, since demanding particular
 * collections would reject a legitimate export from an emptier record.
 *
 * @param value - The candidate, straight from `JSON.parse`.
 *
 * @returns True when the value can be treated as a snapshot.
 */
export function isPortfolioSnapshot(value: unknown): value is PortfolioSnapshot {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.format === PORTFOLIO_FORMAT &&
    typeof v.version === "number" &&
    typeof v.settings === "object" &&
    v.settings !== null &&
    typeof v.content === "object" &&
    v.content !== null
  );
}

/** Raised when portfolio content arriving from outside breaks the contract. */
export class PortfolioContractError extends Error {
  /** Where the offending value came from, named so it can be fixed. */
  readonly source: string;

  /**
   * @param source - The file or URL the value arrived from.
   * @param detail - What was wrong, in terms an author can act on.
   */
  constructor(source: string, detail: string) {
    super(`Portfolio contract violated by ${source}: ${detail}`);
    this.name = "PortfolioContractError";
    this.source = source;
  }
}

/**
 * Checks one item assembled from a fetched markdown seed file.
 *
 * A snapshot downloaded as a file is checked whole by `isPortfolioSnapshot`,
 * but items rebuilt from individual seed files never pass through it, so they
 * are checked here instead of being asserted into shape.
 *
 * @param value - The item assembled from the file's frontmatter and body.
 * @param type - The collection the file belongs to.
 * @param path - The seed path, so a broken file names itself.
 *
 * @returns The same item, now known to carry what every reader assumes.
 *
 * @throws PortfolioContractError When the frontmatter cannot produce an item.
 */
export function validatePortfolioItem(
  value: unknown,
  type: string,
  path: string
): PortfolioItem & Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new PortfolioContractError(path, "item is not an object");
  }
  const v = value as Record<string, unknown>;
  if (typeof v.id !== "string" && typeof v.id !== "number") {
    throw new PortfolioContractError(path, "item has no usable id");
  }
  if (v.type !== type) {
    throw new PortfolioContractError(
      path,
      `item claims type "${String(v.type)}" in the ${type} collection`
    );
  }
  if (!Array.isArray(v.tags)) {
    throw new PortfolioContractError(path, "tags is missing or not a list");
  }
  return value as PortfolioItem & Record<string, unknown>;
}
