/** One block the flow may not break across a page boundary, measured unscaled. */
export interface FlowAtom {
  /** The block's top with every current push removed, in px from the sheet's top. */
  natTop: number;
  /** The block's own height with its current push removed, in px. */
  natH: number;
  /** True for a section heading, which travels with the block that follows it. */
  isHead: boolean;
}

/** The page geometry a plan is measured against, all in px. */
export interface PageGeometry {
  /** A whole page's height, margins included. */
  pageH: number;
  /** The top and bottom margin, which no block may enter. */
  marginY: number;
}

/**
 * Decides how far each block must be pushed to keep it off a page boundary.
 *
 * A block that would cross its page's bottom margin is pushed down to the next
 * page's top margin. Where a section heading sits immediately above such a
 * block, the heading is pushed instead and the block follows it, so a heading is
 * never left alone at the foot of a page. A block taller than a whole content
 * area is left where it is, because no push would help it.
 *
 * The plan is a pure function of the measurements handed in, which is the point.
 * The caller reads every atom first, plans, and only then writes, because reading
 * an element's rect forces the pending layout: a push written part way through a
 * walk is already visible to the rest of it, while the running total of pushes
 * still expects to subtract it, and the resulting plan oscillates forever.
 *
 * @param atoms - Every block in one flow, in document order.
 * @param geometry - The page height and vertical margin to measure against.
 * @returns One push in px per atom, index for index, zero where none is needed.
 *
 * @example
 * ```ts
 * const pushes = planPushes(
 *   [{ natTop: 1000, natH: 60, isHead: true }, { natTop: 1060, natH: 200, isHead: false }],
 *   { pageH: 1122, marginY: 60 },
 * );
 * // The heading travels with its block: [122, 0]
 * ```
 */
export const planPushes = (atoms: FlowAtom[], geometry: PageGeometry): number[] => {
  const { pageH, marginY } = geometry;
  const contentAreaH = pageH - 2 * marginY;
  const pushes = atoms.map(() => 0);
  let offset = 0; // pushes already planned above the current atom
  let prevHead: { index: number; top: number } | null = null;

  atoms.forEach((atom, i) => {
    const top = atom.natTop + offset;
    const page = Math.floor(top / pageH);
    const limit = (page + 1) * pageH - marginY;

    let push = 0;
    if (top + atom.natH > limit + 1 && atom.natH <= contentAreaH) {
      const target = prevHead ? prevHead.index : i;
      const from = prevHead ? prevHead.top : top;
      push = (page + 1) * pageH + marginY - from;
      pushes[target] += push;
    }
    offset += push;
    prevHead = atom.isHead ? { index: i, top: top + push } : null;
  });

  return pushes;
};
