/**
 * Section headings in every language the builder speaks.
 *
 * A document's language setting already renders dates and the open-range word
 * in that language; this module carries the headings across too. Only a
 * heading the builder itself wrote is translated, meaning a catalog default,
 * a field overlay's variant, or any of their translations. A heading the owner
 * typed is theirs and never changes, which is why translation works by exact
 * match against the known set rather than by guessing at text.
 */

import type { ResumeDocument, ResumeSection } from "./model";
import { languageLocale } from "./dates";

/** Every heading the builder writes, keyed by its English form, in each locale. */
const HEADINGS: Record<string, Record<string, string>> = {
  "Summary": { de: "Profil", fr: "Profil", es: "Perfil", tr: "Özet", az: "Xülasə" },
  "Experience": { de: "Berufserfahrung", fr: "Expérience professionnelle", es: "Experiencia profesional", tr: "İş Deneyimi", az: "İş təcrübəsi" },
  "Education": { de: "Ausbildung", fr: "Formation", es: "Formación académica", tr: "Eğitim", az: "Təhsil" },
  "Courses": { de: "Kurse", fr: "Cours", es: "Cursos", tr: "Kurslar", az: "Kurslar" },
  "Awards": { de: "Auszeichnungen", fr: "Distinctions", es: "Premios y distinciones", tr: "Ödüller", az: "Mükafatlar" },
  "Selected Publications": { de: "Ausgewählte Publikationen", fr: "Publications sélectionnées", es: "Publicaciones seleccionadas", tr: "Seçilmiş Yayınlar", az: "Seçilmiş nəşrlər" },
  "Publications": { de: "Publikationen", fr: "Publications", es: "Publicaciones", tr: "Yayınlar", az: "Nəşrlər" },
  "Talks & Speaking": { de: "Vorträge", fr: "Conférences", es: "Ponencias", tr: "Konuşmalar", az: "Çıxışlar" },
  "Volunteering": { de: "Ehrenamt", fr: "Bénévolat", es: "Voluntariado", tr: "Gönüllülük", az: "Könüllülük" },
  "Selected Certificates": { de: "Ausgewählte Zertifikate", fr: "Certifications sélectionnées", es: "Certificaciones seleccionadas", tr: "Seçilmiş Sertifikalar", az: "Seçilmiş sertifikatlar" },
  "Certificates": { de: "Zertifikate", fr: "Certifications", es: "Certificaciones", tr: "Sertifikalar", az: "Sertifikatlar" },
  "Organizations": { de: "Mitgliedschaften", fr: "Affiliations", es: "Afiliaciones", tr: "Üyelikler", az: "Üzvlüklər" },
  "References": { de: "Referenzen", fr: "Références", es: "Referencias", tr: "Referanslar", az: "Referanslar" },
  "Selected Projects": { de: "Ausgewählte Projekte", fr: "Projets sélectionnés", es: "Proyectos seleccionados", tr: "Seçilmiş Projeler", az: "Seçilmiş layihələr" },
  "Research Projects": { de: "Forschungsprojekte", fr: "Projets de recherche", es: "Proyectos de investigación", tr: "Araştırma Projeleri", az: "Tədqiqat layihələri" },
  "Interests": { de: "Interessen", fr: "Centres d'intérêt", es: "Intereses", tr: "İlgi Alanları", az: "Maraqlar" },
  "Software & Programming Skills": { de: "Software- und Programmierkenntnisse", fr: "Compétences logicielles et en programmation", es: "Competencias en software y programación", tr: "Yazılım ve Programlama Becerileri", az: "Proqram təminatı və proqramlaşdırma bacarıqları" },
  "Languages": { de: "Sprachen", fr: "Langues", es: "Idiomas", tr: "Diller", az: "Dillər" },
  "Writing": { de: "Beiträge", fr: "Articles", es: "Artículos", tr: "Yazılar", az: "Yazılar" },
  "Notes": { de: "Notizen", fr: "Notes", es: "Notas", tr: "Notlar", az: "Qeydlər" },
  "Declaration": { de: "Erklärung", fr: "Déclaration", es: "Declaración", tr: "Beyan", az: "Bəyanat" },
  "Custom Section": { de: "Weiterer Abschnitt", fr: "Section personnalisée", es: "Sección personalizada", tr: "Özel Bölüm", az: "Xüsusi bölmə" },
  "Signature": { de: "Unterschrift", fr: "Signature", es: "Firma", tr: "İmza", az: "İmza" },
};

/** The closing line beneath a signature heading, in each locale. */
const PLACE_DATE: Record<string, string> = {
  en: "Place, date",
  de: "Ort, Datum",
  fr: "Lieu, date",
  es: "Lugar y fecha",
  tr: "Yer, tarih",
  az: "Yer, tarix",
};

// Reverse index: any known heading in any language points back at its English key.
const ENGLISH_OF = new Map<string, string>();
for (const [english, byLocale] of Object.entries(HEADINGS)) {
  ENGLISH_OF.set(english, english);
  for (const text of Object.values(byLocale)) ENGLISH_OF.set(text, english);
}

/** The locale key the heading table uses; both Englishes read the English key. */
const tableLocale = (language?: string): string => {
  const locale = languageLocale(language);
  return locale.startsWith("en") ? "en" : locale;
};

/**
 * Translates one heading into a language, if the builder wrote it.
 *
 * @param heading - The heading as it stands, in any of the known languages.
 * @param language - The document language to render it in.
 *
 * @returns The heading in that language, or the input unchanged when it is
 *   not one the builder knows, which is how an owner's own heading survives.
 */
export function localizeHeading(heading: string, language?: string): string {
  const english = ENGLISH_OF.get(heading.trim());
  if (!english) return heading;
  const locale = tableLocale(language);
  return locale === "en" ? english : HEADINGS[english][locale] ?? english;
}

/** The signature block's closing line in a language. */
export const placeDateLine = (language?: string): string =>
  PLACE_DATE[tableLocale(language)] ?? PLACE_DATE.en;

/**
 * Carries every builder-written heading in a section list into a language.
 *
 * @param sections - The sections to translate; never mutated.
 * @param language - The document language.
 *
 * @returns New sections with known headings translated and owner headings kept.
 */
export function relocalizeSections(sections: ResumeSection[], language?: string): ResumeSection[] {
  return sections.map((s) => {
    const heading = localizeHeading(s.heading, language);
    return heading === s.heading ? s : { ...s, heading };
  });
}

/**
 * Sets a document's language and carries its headings along.
 *
 * @param doc - The document to adjust; never mutated.
 * @param language - The new document language.
 *
 * @returns A new document whose style names the language and whose
 *   builder-written headings read in it.
 */
export function setDocumentLanguage(doc: ResumeDocument, language: string): ResumeDocument {
  return {
    ...doc,
    sections: relocalizeSections(doc.sections, language),
    style: { ...doc.style, language },
  };
}
