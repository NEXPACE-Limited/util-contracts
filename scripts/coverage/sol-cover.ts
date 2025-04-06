import { CommonCoverage, Coverage, Loc, Pos, posCmp, sumCoverage } from "./common";

export type BranchType = "if";

export interface Branch {
  type: BranchType;
  values: {
    loc: Loc;
    hits: number;
  }[];
}

export interface Common extends CommonCoverage {
  id: string;
  line: number;
  loc: Loc;
  hits: number;
}

export interface Line extends Common {
  branch?: Branch;
}

export interface Func extends Common {
  name: string;
  lines: Line[];
}

export interface File extends CommonCoverage {
  key: string;
  path: string;
  fns: Func[];
  outerFunc: Func;
}

export interface SolCover extends CommonCoverage {
  files: File[];
}

namespace json {
  type NumberMap<T> = Record<string, T>;

  interface JsonFunc {
    name: string;
    line: number;
    loc: Loc;
  }

  interface JsonBranch {
    line: number;
    type: BranchType;
    locations: readonly [Loc, Loc];
  }

  type HMap = NumberMap<number>;
  type BHMap = NumberMap<readonly [number, number]>;

  interface JsonFile {
    l: HMap;
    path: string;
    s: HMap;
    b: BHMap;
    f: HMap;
    fnMap: NumberMap<JsonFunc>;
    statementMap: NumberMap<Loc>;
    branchMap: NumberMap<JsonBranch>;
  }

  export type SolCoverJson = Record<string, JsonFile>;

  class SolCoverError extends Error {
    constructor(readonly name: string, readonly description: string) {
      super();
    }

    get message() {
      return `${this.description} -- ${this.name}`;
    }
  }

  const nullCov: Coverage = {
    covered: 0,
    valid: 0,
  };

  const nullCommonCov: CommonCoverage = {
    lineCoverage: nullCov,
    branchCoverage: nullCov,
  };

  function covFromHits(hits: number): CommonCoverage & { hits: number } {
    return {
      hits,
      lineCoverage: {
        covered: hits ? 1 : 0,
        valid: 1,
      },
      branchCoverage: nullCov,
    };
  }

  const nullPos: Pos = {
    line: 1,
    column: 1,
  };

  const nullLoc: Loc = {
    start: nullPos,
    end: nullPos,
  };

  function coveringLoc(locs: readonly Loc[]) {
    if (locs.length === 0) return nullLoc;
    const ret: Loc = {
      ...locs[0],
    };
    locs.forEach((loc) => {
      if (posCmp(loc.start, ret.start) < 0) ret.start = loc.start;
      if (posCmp(loc.end, ret.end) > 0) ret.end = loc.end;
    });
    return ret;
  }

  export function fromJSON(json: SolCoverJson): SolCover {
    const fthrow = (err: any) => {
      throw err;
    };

    const files = Object.entries(json).map(([key, file]): File => {
      const solThrow = (desc: string) => fthrow(new SolCoverError(key, desc));
      const outer: Func = {
        id: "",
        name: "",
        loc: nullLoc,
        line: 1,
        lines: [],
        hits: 0,
        ...nullCommonCov,
      };
      const fns = Object.entries(file.fnMap)
        .map(
          ([id, fn]): Func => ({
            id,
            name: fn.name,
            loc: fn.loc,
            line: fn.line,
            lines: [],
            ...covFromHits(file.f[id] ?? solThrow(`${id} not in f`)),
          })
        )
        .map((x) => {
          const cmp = posCmp(x.loc.start, x.loc.end);
          if (cmp > 0) solThrow(`loc reversed (fnMap[${x.id}])`);
          if (cmp === 0) solThrow(`zero-sized loc not allowed (fnMap[${x.id}])`);
          return x;
        })
        .sort(({ loc: { start: as, end: ae }, id: ai }, { loc: { start: bs, end: be }, id: bi }) => {
          if (posCmp(ae, bs) <= 0) return -1;
          if (posCmp(as, be) >= 0) return 1;
          return solThrow(`loc intersects (fnMap[${ai}], fnMap[${bi}])`);
        });

      const findMethod = (pos: Pos) => {
        let l = 0;
        let u = fns.length - 1;
        while (l < u) {
          const m = (l + u + 1) >> 1;
          if (posCmp(pos, fns[m].loc.start) < 0) {
            u = m - 1;
          } else {
            l = m;
          }
        }
        const x = fns[l];
        if (posCmp(pos, x.loc.end) > 0) return null;
        return x;
      };

      Object.entries(file.statementMap).forEach(([id, loc]) => {
        const m = findMethod(loc.start) ?? outer;
        const hits = file.s[id] ?? solThrow(`${id} not in s`);
        m.lines.push({
          id,
          loc,
          line: loc.start.line,
          ...covFromHits(hits),
        });
      });

      Object.entries(file.branchMap).forEach(([id, br]) => {
        const m = findMethod(br.locations[0].start) ?? outer;
        const hits = file.b[id] ?? solThrow(`${id} not in b`);
        if (hits.length !== br.locations.length) solThrow(`branch length mismatch (branchMap[${id}])`);
        m.lines.push({
          id,
          loc: coveringLoc(br.locations),
          line: br.line,
          hits: hits.reduce((a, b) => a + b),
          lineCoverage: nullCov,
          branchCoverage: {
            covered: hits.filter((x) => x).length,
            valid: hits.length,
          },
        });
      });

      [...fns, outer].forEach((m) => {
        m.lines.sort((a, b) => posCmp(a.loc.start, b.loc.start));
      });

      fns.forEach((m) => {
        Object.assign(m, sumCoverage([...m.lines, m]));
      });

      return {
        key,
        path: file.path,
        fns,
        ...sumCoverage([...fns, outer]),
        outerFunc: outer,
      };
    });

    return {
      ...sumCoverage(files),
      files,
    };
  }
}

const { fromJSON } = json;
type SolCoverJson = json.SolCoverJson;

export { fromJSON, SolCoverJson };
