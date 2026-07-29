// The builder's OWN copy of the portfolio.json contract: the file exported
// by the TABULARIUM admin panel and imported here as the content source. The
// sister repos keep their own copies of this contract; nothing is imported
// across the repository boundary.
// `format` + `version` keep the two sides honest across repos.
//
// Item shapes below describe only the fields this builder reads; the site's
// export carries more, which structural typing happily ignores.

export const PORTFOLIO_FORMAT = "vita-portfolio";
export const PORTFOLIO_VERSION = 1;

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

export interface PortfolioExperience extends PortfolioItem {
  company?: string;
}
export interface PortfolioEducation extends PortfolioItem {
  institution?: string;
  degree?: string;
  field?: string;
  gpa?: string;
}
export interface PortfolioCourse extends PortfolioItem {
  provider?: string;
}
export interface PortfolioAward extends PortfolioItem {
  issuer?: string;
  amount?: string;
  awardType?: string;
}
export interface PortfolioPublication extends PortfolioItem {
  venue?: string;
  year?: string;
  doi?: string;
  authors?: string;
}
export interface PortfolioSpeaking extends PortfolioItem {
  event?: string;
  video?: string;
  slides?: string;
}
export interface PortfolioVolunteering extends PortfolioItem {
  organization?: string;
}
export interface PortfolioCertificate extends PortfolioItem {
  issuer?: string;
  credentialId?: string;
  certType?: string;
}
export interface PortfolioOrganization extends PortfolioItem {
  role?: string;
  website?: string;
  memberType?: string;
}
export interface PortfolioReference extends PortfolioItem {
  name?: string;
  role?: string;
  organization?: string;
  relationship?: string;
  email?: string;
  phone?: string;
}
export interface PortfolioProject extends PortfolioItem {
  role?: string;
  year?: string;
  desc?: string;
  stats?: string;
}
export interface PortfolioInterest extends PortfolioItem {
  category?: string;
}
export interface PortfolioBlogPost extends PortfolioItem {
  slug?: string;
  excerpt?: string;
  externalUrl?: string; // canonical home elsewhere; preferred link when set
}
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
