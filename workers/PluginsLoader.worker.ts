import { hash_plugin, parse_plugin } from "skyrim-cell-dump-wasm";

self.addEventListener('message', async (event: MessageEvent<{ skipParsing?: boolean; filename: string; lastModified: number; contents: Uint8Array}>) => {
  const { skipParsing, filename, lastModified, contents } = event.data;
  let parsed = undefined;
  let parseError = undefined;
  try {
    if (!skipParsing) {
      try {
        parsed = parse_plugin(contents);
      } catch (e) {
        if (e instanceof Error) {
          parseError = e.message;
        } else {
          parseError = "unknown error";
        }
      }
    }
    const hash = hash_plugin(contents).toString(36);
    console.log(filename)
    console.log(parsed);
    self.postMessage({ filename, lastModified, parsed, hash, parseError, enabled: parsed && !parseError });
  } catch (error) {
    console.error(error);
    self.postMessage(error);
  }
});

//! To avoid isolatedModules error 
// eslint-disable-next-line import/no-anonymous-default-export
export default {};