import React, { useEffect, useRef } from "react";

import { useAppSelector, useAppDispatch } from "../lib/hooks";
import {
  addPluginInOrder,
  clearPlugins,
  setPending,
  decrementPending,
  PluginFile,
} from "../slices/plugins";
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
  const workerRef = useRef<Worker>();
  const dispatch = useAppDispatch();
  const plugins = useAppSelector((state) => state.plugins.plugins);

  useEffect(() => {
    async function loadWorker() {
      const { default: Worker } = await import(
        "worker-loader?filename=static/[fullhash].worker.js!../workers/PluginsLoader.worker"
      );
      console.log(Worker);
      workerRef.current = new Worker();
      workerRef.current.onmessage = (evt: { data: PluginFile }) => {
        const { data } = evt;
        console.log(`WebWorker Response =>`);
        dispatch(decrementPending(1));
        console.log(data.parsed);
        dispatch(addPluginInOrder(data));
      };
    }
    loadWorker();
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [dispatch]);

  const onDataDirButtonClick = async () => {
    if (!workerRef.current) {
      return alert("Worker not loaded yet");
    }
    const dirHandle = await (
      window as Window & typeof globalThis & { showDirectoryPicker: () => any }
    ).showDirectoryPicker();
    dispatch(clearPlugins());
    const values = dirHandle.values();
    const plugins = [];
    while (true) {
      const next = await values.next();
      if (next.done) {
        break;
      }
      if (
        next.value.kind == "file" &&
        (next.value.name.endsWith(".esp") ||
          next.value.name.endsWith(".esm") ||
          next.value.name.endsWith(".esl"))
      ) {
        console.log(next.value);
        plugins.push(next.value);
      }
    }
    dispatch(setPending(plugins.length));

    for (const plugin of plugins) {
      const file = await plugin.getFile();
      console.log(file.lastModified);
      console.log(file.lastModifiedDate);
      const contents = new Uint8Array(await file.arrayBuffer());
      try {
        workerRef.current.postMessage(
          {
            skipParsing: excludedPlugins.includes(plugin.name),
            filename: plugin.name,
            lastModified: file.lastModified,
            contents,
          },
          [contents.buffer]
        );
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <>
      <p className={styles["no-top-margin"]}>
        To see all of the cell edits and conflicts for your current mod load
        order select your <code>Data</code> directory below to load the plugins.
      </p>
      <button onClick={onDataDirButtonClick}>
        {plugins.length === 0 ? "Open" : "Reload"} Skyrim Data directory
      </button>
    </>
  );
};

export default DataDirPicker;
