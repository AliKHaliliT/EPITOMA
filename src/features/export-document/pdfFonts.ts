// Font registry for the direct PDF export: maps the builder's font catalog to
// the bundled TTF faces (src/assets/pdf-fonts) and registers them with
// react-pdf. The files are full fonts (Latin-Extended included), so Turkish
// and Azerbaijani text embeds correctly. Everything here lives in the lazily
// loaded PDF chunk; nothing loads until an export runs.

import { Font } from "@react-pdf/renderer";

import interRegular from "../../assets/pdf-fonts/inter-regular.ttf?url";
import interBold from "../../assets/pdf-fonts/inter-bold.ttf?url";
import interItalic from "../../assets/pdf-fonts/inter-italic.ttf?url";
import sourceSans3Regular from "../../assets/pdf-fonts/source-sans-3-regular.ttf?url";
import sourceSans3Bold from "../../assets/pdf-fonts/source-sans-3-bold.ttf?url";
import sourceSans3Italic from "../../assets/pdf-fonts/source-sans-3-italic.ttf?url";
import latoRegular from "../../assets/pdf-fonts/lato-regular.ttf?url";
import latoBold from "../../assets/pdf-fonts/lato-bold.ttf?url";
import latoItalic from "../../assets/pdf-fonts/lato-italic.ttf?url";
import robotoRegular from "../../assets/pdf-fonts/roboto-regular.ttf?url";
import robotoBold from "../../assets/pdf-fonts/roboto-bold.ttf?url";
import robotoItalic from "../../assets/pdf-fonts/roboto-italic.ttf?url";
import titilliumRegular from "../../assets/pdf-fonts/titillium-web-regular.ttf?url";
import titilliumBold from "../../assets/pdf-fonts/titillium-web-bold.ttf?url";
import titilliumItalic from "../../assets/pdf-fonts/titillium-web-italic.ttf?url";
import merriweatherRegular from "../../assets/pdf-fonts/merriweather-regular.ttf?url";
import merriweatherBold from "../../assets/pdf-fonts/merriweather-bold.ttf?url";
import merriweatherItalic from "../../assets/pdf-fonts/merriweather-italic.ttf?url";
import loraRegular from "../../assets/pdf-fonts/lora-regular.ttf?url";
import loraBold from "../../assets/pdf-fonts/lora-bold.ttf?url";
import loraItalic from "../../assets/pdf-fonts/lora-italic.ttf?url";
import sourceSerif4Regular from "../../assets/pdf-fonts/source-serif-4-regular.ttf?url";
import sourceSerif4Bold from "../../assets/pdf-fonts/source-serif-4-bold.ttf?url";
import sourceSerif4Italic from "../../assets/pdf-fonts/source-serif-4-italic.ttf?url";

const FACES: Record<string, { regular: string; bold: string; italic: string }> = {
  Inter: { regular: interRegular, bold: interBold, italic: interItalic },
  "Source Sans 3": { regular: sourceSans3Regular, bold: sourceSans3Bold, italic: sourceSans3Italic },
  Lato: { regular: latoRegular, bold: latoBold, italic: latoItalic },
  Roboto: { regular: robotoRegular, bold: robotoBold, italic: robotoItalic },
  "Titillium Web": { regular: titilliumRegular, bold: titilliumBold, italic: titilliumItalic },
  Merriweather: { regular: merriweatherRegular, bold: merriweatherBold, italic: merriweatherItalic },
  Lora: { regular: loraRegular, bold: loraBold, italic: loraItalic },
  "Source Serif 4": { regular: sourceSerif4Regular, bold: sourceSerif4Bold, italic: sourceSerif4Italic },
};

const registered = new Set<string>();

/** Register a catalog family with react-pdf; returns the usable font-family
 *  name (Helvetica when the family is unknown or registration fails). */
export function ensurePdfFont(label: string): string {
  const faces = FACES[label];
  if (!faces) return "Helvetica";
  if (registered.has(label)) return label;
  try {
    Font.register({
      family: label,
      fonts: [
        { src: faces.regular },
        { src: faces.bold, fontWeight: 700 },
        { src: faces.italic, fontStyle: "italic" },
      ],
    });
    registered.add(label);
    return label;
  } catch {
    return "Helvetica";
  }
}

// Resumes read better without hyphenation; the preview never hyphenates.
let hyphenationSet = false;
/**
 * Stops react-pdf from hyphenating, which it does by default.
 *
 * A resume breaks words across lines badly, so the callback returns each word
 * whole. Registering once is enough, and repeat calls do nothing.
 *
 * @returns Nothing.
 */
export function disablePdfHyphenation() {
  if (hyphenationSet) return;
  Font.registerHyphenationCallback((word) => [word]);
  hyphenationSet = true;
}
