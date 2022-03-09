import { WorkerPool } from "./WorkerPool";
import store from "./store";
import { clearPlugins, setPending } from "../slices/plugins";

export const excludedPlugins = [
  "Skyrim.esm",
  "Update.esm",
  "Dawnguard.esm",
  "HearthFires.esm",
  "Dragonborn.esm",
];

export const isPluginPath = (path: string) => {
  if (
    path.endsWith(".esp") ||
    path.endsWith(".esm") ||
    path.endsWith(".esl")
  ) {
    return true;
  }
  return false;
}

export const isPlugin = (file: File) => {
  return isPluginPath(file.name);
}

export const parsePluginFiles = (pluginFiles: File[], workerPool: WorkerPool) => {
  store.dispatch(clearPlugins());
  store.dispatch(setPending(pluginFiles.length));

  pluginFiles.forEach(async (plugin) => {
    const contents = new Uint8Array(await plugin.arrayBuffer());
    workerPool.pushTask({
      skipParsing: excludedPlugins.includes(plugin.name),
      filename: plugin.name,
      lastModified: plugin.lastModified,
      contents,
    });
  });
}