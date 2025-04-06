import { Readable } from "stream";
import { promisify } from "util";

export async function consumeStream(stream: Readable) {
  const chunks: Uint8Array[] = [];
  let savedCb: any;
  const promise = promisify((cb) => {
    stream.once("end", cb);
    stream.once("error", cb);
    savedCb = cb;
  })();
  stream.on("data", (chunk) => {
    chunks.push(chunk);
  });
  try {
    await promise;
  } finally {
    stream.off("end", savedCb);
    stream.off("error", savedCb);
  }
  return Buffer.concat(chunks);
}

export async function readFromStdin() {
  return consumeStream(process.stdin);
}
