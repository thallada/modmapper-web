import React, { useContext } from "react";

import { WorkerPoolContext } from "../pages/index";
import { useAppDispatch } from "../lib/hooks";
import { clearPlugins, setPending } from "../slices/plugins";
import styles from "../styles/DataDirPicker.module.css";

export const excludedPlugins = [
  "Skyrim.esm",
  "Update.esm",
  "Dawnguard.esm",
  "HearthFires.esm",
  "Dragonborn.esm",
];

type Props = {};

const DataDirPicker: React.FC<Props> = () => {
  const workerPool = useContext(WorkerPoolContext);
  const dispatch = useAppDispatch();

  const onDataDirButtonClick = async (event: {
    target: { files: FileList | null };
  }) => {
    if (!workerPool) {
      return alert("Workers not loaded yet");
    }
    const files = event.target.files ?? [];
    dispatch(clearPlugins());
    const plugins = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (
        file.name.endsWith(".esp") ||
        file.name.endsWith(".esm") ||
        file.name.endsWith(".esl")
      ) {
        plugins.push(file);
      }
    }
    dispatch(setPending(plugins.length));

    plugins.forEach(async (plugin, index) => {
      const contents = new Uint8Array(await plugin.arrayBuffer());
      try {
        workerPool.pushTask({
          skipParsing: excludedPlugins.includes(plugin.name),
          filename: plugin.name,
          lastModified: plugin.lastModified,
          contents,
        });
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <>
      <p className={styles["no-top-margin"]}>
        To see all of the cell edits and conflicts for your current mod load
        order select your <code>Data</code> directory below to load the plugins.
      </p>
      <input
        type="file"
        webkitdirectory=""
        onChange={onDataDirButtonClick}
        disabled={!workerPool}
      />
    </>
  );
};

export default DataDirPicker;
