import Link from "next/link";
import { createPortal } from "react-dom";
import React, { useEffect, useRef, useState } from "react";

import { useAppSelector, useAppDispatch } from "../lib/hooks";
import { setPluginsTxt } from "../slices/pluginsTxt";
import {
  addPluginInOrder,
  applyLoadOrder,
  clearPlugins,
  setPending,
  decrementPending,
  togglePlugin,
  PluginFile,
} from "../slices/plugins";
import styles from "../styles/PluginLoader.module.css";

const excludedPlugins = [
  "Skyrim.esm",
  "Update.esm",
  "Dawnguard.esm",
  "HearthFires.esm",
  "Dragonborn.esm",
];

type Props = {};

const PluginsLoader: React.FC<Props> = () => {
  const workerRef = useRef<Worker>();
  const [editPluginsTxt, setEditPluginsTxt] = useState<string | null>(null);
  const [pluginsTxtShown, setPluginsTxtShown] = useState(false);
  const dispatch = useAppDispatch();
  const plugins = useAppSelector((state) => state.plugins.plugins);
  const pluginsPending = useAppSelector((state) => state.plugins.pending);
  const pluginsTxt = useAppSelector((state) => state.pluginsTxt);

  useEffect(() => {
    setPluginsTxtShown(false);
    console.log("going to apply!");
    dispatch(applyLoadOrder());
  }, [dispatch, pluginsTxt]);

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

  const onPluginsTxtButtonClick = async () => {
    setEditPluginsTxt(pluginsTxt);
    setPluginsTxtShown(true);
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
      <p>
        Paste or drag-and-drop your <code>plugins.txt</code> below to sort and
        enable the loaded plugins by your current load order.
      </p>
      <button
        onClick={onPluginsTxtButtonClick}
        className={styles["plugins-txt-button"]}
      >
        {!pluginsTxt ? "Paste" : "Edit"} Skyrim plugins.txt file
      </button>
      <ol className={styles["plugin-list"]}>
        {plugins.map((plugin) => (
          <li key={plugin.filename} title={plugin.filename}>
            <input
              id={plugin.filename}
              type="checkbox"
              disabled={
                excludedPlugins.includes(plugin.filename) || !!plugin.parseError
              }
              checked={plugin.enabled}
              onChange={() => dispatch(togglePlugin(plugin.filename))}
            />
            <label htmlFor={plugin.filename} className={styles["plugin-label"]}>
              {excludedPlugins.includes(plugin.filename) ? (
                <span>{plugin.filename}</span>
              ) : (
                <Link href={`/?plugin=${plugin.hash}`}>
                  <a
                    className={plugin.parseError ? styles["plugin-error"] : ""}
                  >
                    {plugin.filename}
                  </a>
                </Link>
              )}
            </label>
            {/* <p>{plugin.parsed && plugin.parsed.header.description}</p> */}
          </li>
        ))}
      </ol>
      {pluginsPending > 0 && (
        <span className={styles.processing}>
          Loading {pluginsPending} plugin{pluginsPending === 1 ? "" : "s"}
        </span>
      )}
      {process.browser &&
        createPortal(
          <dialog
            open={pluginsTxtShown}
            className={styles["plugins-txt-dialog"]}
          >
            <h3>Paste plugins.txt</h3>
            <p>
              The plugins.txt file is typically found at{" "}
              <code>
                C:\Users\username\AppData\Local\Skyrim Special Edition
              </code>
              . You can also drag-and-drop the file anywhere on the window to
              load the file.
            </p>
            <textarea
              value={editPluginsTxt ?? undefined}
              onChange={(e) => setEditPluginsTxt(e.target.value)}
            />
            <menu>
              <button
                onClick={() => {
                  setEditPluginsTxt(null);
                  setPluginsTxtShown(false);
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  dispatch(setPluginsTxt(editPluginsTxt ?? ""));
                  setPluginsTxtShown(false);
                }}
              >
                Save
              </button>
            </menu>
          </dialog>,
          document.body
        )}
      {process.browser &&
        createPortal(<div className={styles["drop-area"]} />, document.body)}
    </>
  );
};

export default PluginsLoader;
