import { readFromStdin } from "./util";
import { getRate, showPercentage, solCover, SolCoverJson, totalCoverage } from "./coverage";

function parseRate(x: string) {
  if (x.endsWith("%")) return +x.substring(0, x.length - 1) * 0.01;
  return +x;
}

async function main() {
  const json = JSON.parse((await readFromStdin()).toString("utf-8")) as SolCoverJson;
  const solCoverObj = solCover.fromJSON(json);
  const rate = getRate(totalCoverage(solCoverObj));
  console.log(`total coverage: ${showPercentage(rate)}`);
  const requiredRate = parseRate(process.env.REQUIRED_TOTAL_COVERAGE ?? "0");
  if (rate < requiredRate) throw new Error("coverage requirement not met");
}

main().then();
