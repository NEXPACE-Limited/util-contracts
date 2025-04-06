export interface Pos {
  line: number;
  column: number;
}

export interface Loc {
  start: Pos;
  end: Pos;
}

export function posCmp(a: Pos, b: Pos) {
  return a.line - b.line || a.column - b.column;
}

export interface Coverage {
  covered: number;
  valid: number;
}

export function getRate(x: Coverage) {
  return x.covered === x.valid ? 1 : x.covered / x.valid;
}

export function showPercentage(rate: number) {
  return `${(rate * 100).toFixed(1)}%`;
}

export interface CommonCoverage {
  lineCoverage: Coverage;
  branchCoverage: Coverage;
}

export function sumCoverage(a: readonly CommonCoverage[]): CommonCoverage {
  const ret = {
    lineCoverage: {
      covered: 0,
      valid: 0,
    },
    branchCoverage: {
      covered: 0,
      valid: 0,
    },
  };
  a.forEach((x) => {
    ret.lineCoverage.covered += x.lineCoverage.covered;
    ret.lineCoverage.valid += x.lineCoverage.valid;
    ret.branchCoverage.covered += x.branchCoverage.covered;
    ret.branchCoverage.valid += x.branchCoverage.valid;
  });
  return ret;
}

export function totalCoverage(x: CommonCoverage) {
  return {
    covered: x.lineCoverage.covered + x.branchCoverage.covered,
    valid: x.lineCoverage.valid + x.branchCoverage.valid,
  };
}
