import { describe, expect, it } from "vitest";
import { FlowAtom, PageGeometry, planPushes } from "@/entities/resume";

const GEO: PageGeometry = { pageH: 1000, marginY: 100 };

/**
 * Where the plan puts each block, modelled the way the browser does it.
 *
 * A paddingTop does not move the element's own box, it makes the box taller and
 * moves what follows. So a pushed block's content starts below its own box top,
 * and every later block's box starts below the sum of the pushes above it.
 */
const placed = (atoms: FlowAtom[], pushes: number[]) => {
  let above = 0;
  return atoms.map((a, i) => {
    const boxTop = a.natTop + above;
    above += pushes[i];
    const top = boxTop + pushes[i];
    return { boxTop, boxH: a.natH + pushes[i], top, bottom: top + a.natH };
  });
};

/** Every block sits inside its page's margins, which is the whole point. */
const expectNothingStraddles = (atoms: FlowAtom[], pushes: number[], label = "") => {
  for (const [i, box] of placed(atoms, pushes).entries()) {
    if (atoms[i].natH > GEO.pageH - 2 * GEO.marginY) continue; // no push would help
    const page = Math.floor(box.top / GEO.pageH);
    const limit = (page + 1) * GEO.pageH - GEO.marginY;
    expect(box.bottom, `${label}atom ${i} crosses its page's bottom margin`).toBeLessThanOrEqual(limit + 1);
  }
};

/** A flow of headings and blocks, deterministic and long enough to cross pages. */
const longFlow = (start: number): FlowAtom[] => {
  const atoms: FlowAtom[] = [];
  let top = start;
  for (let i = 0; i < 40; i += 1) {
    const isHead = i % 4 === 0;
    const natH = isHead ? 40 : 90 + (i % 5) * 37;
    atoms.push({ natTop: top, natH, isHead });
    top += natH;
  }
  return atoms;
};

describe("planPushes", () => {
  it("leaves a flow that fits alone", () => {
    const atoms: FlowAtom[] = [
      { natTop: 100, natH: 200, isHead: true },
      { natTop: 300, natH: 400, isHead: false },
    ];
    expect(planPushes(atoms, GEO)).toEqual([0, 0]);
  });

  it("pushes a block that would cross the bottom margin to the next page", () => {
    const atoms: FlowAtom[] = [{ natTop: 800, natH: 200, isHead: false }];
    const pushes = planPushes(atoms, GEO);
    expect(pushes[0]).toBeGreaterThan(0);
    expect(placed(atoms, pushes)[0].top).toBe(1100); // the second page's top margin
  });

  it("sends an orphaned heading down with the block it introduces", () => {
    const atoms: FlowAtom[] = [
      { natTop: 820, natH: 40, isHead: true },
      { natTop: 860, natH: 200, isHead: false },
    ];
    const pushes = planPushes(atoms, GEO);
    expect(pushes[1]).toBe(0); // the block itself stays flat
    const boxes = placed(atoms, pushes);
    expect(boxes[0].top).toBe(1100);
    expect(boxes[1].top).toBe(1140); // still directly under its heading
  });

  it("leaves a block taller than a page where it is, since no push would help", () => {
    const atoms: FlowAtom[] = [{ natTop: 500, natH: 900, isHead: false }];
    expect(planPushes(atoms, GEO)).toEqual([0]);
  });

  it("keeps every block off a boundary, whatever offset the flow starts at", () => {
    for (let start = 0; start < 400; start += 7) {
      const atoms = longFlow(start);
      expectNothingStraddles(atoms, planPushes(atoms, GEO), `start ${start}: `);
    }
  });

  // The defect this module was extracted for. The preview used to read an atom's
  // rect, write its push, then read the next one, and a read forces the pending
  // layout, so every atom below the first write measured one push too high. The
  // plan flipped on each pass and the sheet oscillated several times a second.
  //
  // The cure is structural, a read pass then a plan then a write pass, so what
  // this pins is the contract that makes it work: the caller recovers each
  // atom's natural position and height from the pushed layout by subtracting the
  // pushes above it and its own padding, and a plan drawn from those recovered
  // numbers is the same plan again.
  it("re-plans identically from measurements recovered out of its own layout", () => {
    for (let start = 0; start < 400; start += 7) {
      const atoms = longFlow(start);
      const first = planPushes(atoms, GEO);
      const boxes = placed(atoms, first);

      let above = 0;
      const recovered = atoms.map((a, i) => {
        const natTop = boxes[i].boxTop - above;
        const natH = boxes[i].boxH - first[i];
        above += first[i];
        return { natTop, natH, isHead: a.isHead };
      });

      expect(recovered, `start ${start}: recovery lost the natural measurements`).toEqual(atoms);
      expect(planPushes(recovered, GEO), `start ${start}: plan did not settle`).toEqual(first);
    }
  });
});
