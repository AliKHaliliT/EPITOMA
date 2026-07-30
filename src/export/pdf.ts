// PDF export: generated directly in the browser and downloaded as a file. No
// print window, no dialog, no printer drivers deciding the margins: the sheet
// is rendered by @react-pdf's layout engine from the same layout contract as
// every other format, with the catalog fonts embedded (Latin-Extended
// included, so localized documents carry their glyphs). The heavy renderer
// and the font files live in a lazily loaded chunk; nothing loads until the
// first export.

import { ResumeDocument } from "@/types/resume";
import { downloadFile, slugify } from "./shared";

/** SVG photos (the sample's portrait) rasterize to PNG first: the PDF
 *  engine embeds JPEG/PNG, not SVG documents. */
async function rasterizePhoto(doc: ResumeDocument): Promise<ResumeDocument> {
  const photo = doc.personal.photo;
  if (!photo || !photo.startsWith("data:image/svg")) return doc;
  try {
    const img = new window.Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("photo load failed"));
      img.src = photo;
    });
    const size = 240;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const cx = canvas.getContext("2d");
    if (!cx) return doc;
    cx.drawImage(img, 0, 0, size, size);
    return { ...doc, personal: { ...doc.personal, photo: canvas.toDataURL("image/png") } };
  } catch {
    return { ...doc, personal: { ...doc.personal, photo: undefined } };
  }
}

export async function exportPdf(doc: ResumeDocument): Promise<void> {
  // The renderer, the layout engine, and the fonts arrive on demand.
  const [{ pdf }, { PdfSheet }, { disablePdfHyphenation }, react] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./PdfSheet"),
    import("./pdfFonts"),
    import("react"),
  ]);
  disablePdfHyphenation();
  const prepared = await rasterizePhoto(doc);
  const element = react.createElement(PdfSheet, { doc: prepared }) as Parameters<typeof pdf>[0];
  const blob = await pdf(element).toBlob();
  downloadFile(`${slugify(doc.name)}.pdf`, "application/pdf", blob);
}
