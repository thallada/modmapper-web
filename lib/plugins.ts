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
    /^((Skyrim Special Edition|Skyrim|SkyrimVR)\/)?(Data\/)?[^/\\]*\.es[mpl]$/i.test(path)
  ) {
    return true;
  }
  return false;
}

export const isPlugin = (file: File) => {
  return isPluginPath(file.webkitRelativePath ?? file.name);
}

export const parsePluginFiles = (pluginFiles: File[], workerPool: WorkerPool) => {
  if (pluginFiles.length === 0) {
    alert("Found no plugins in the folder. Please select the Data folder underneath the Skyrim installation folder.");
    return;
  }
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

// From: https://stackoverflow.com/a/18650828
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}