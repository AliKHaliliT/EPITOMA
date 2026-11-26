// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "@/shared/lib";

describe("sanitizeHtml", () => {
  it("drops a script a record's markup carries", () => {
    expect(sanitizeHtml("<p>Led the team</p><script>steal()</script>")).toBe("<p>Led the team</p>");
  });

  it("drops an event handler on an element it keeps", () => {
    expect(sanitizeHtml('<img src="x.png" onerror="steal()">')).toBe('<img src="x.png">');
  });

  it("drops a javascript link target and keeps the link text", () => {
    expect(sanitizeHtml('<a href="javascript:steal()">site</a>')).toBe("<a>site</a>");
  });

  it("keeps the formatting the editor and the record produce", () => {
    const formatted =
      '<p><strong>Bold</strong> and <em>italic</em></p><ul><li>One</li></ul><a href="https://example.org">link</a>';
    expect(sanitizeHtml(formatted)).toBe(formatted);
  });
});
