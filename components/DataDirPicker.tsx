import React, { useContext, useRef, useState, useEffect } from "react";

import { WorkerPoolContext } from "../lib/WorkerPool";
import { useAppSelector } from "../lib/hooks";
import { isPlugin, parsePluginFiles } from "../lib/plugins";
import styles from "../styles/DataDirPicker.module.css";

type Props = {};

const DataDirPicker: React.FC<Props> = () => {
  const workerPool = useContext(WorkerPoolContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const plugins = useAppSelector((state) => state.plugins.plugins);
  const pluginsPending = useAppSelector((state) => state.plugins.pending);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (pluginsPending === 0 && loading) {
      setLoading(false);
    } else if (pluginsPending > 0 && !loading) {
      setLoading(true);
    }
  }, [pluginsPending, loading, setLoading]);

  // It would be nice to open the directory with window.showDirectoryPicker() in supported browsers,
  // but it does not allow selecting directories under C:\\Program Files and it does not throw any error
  // that I can catch here when a user tries to select it, so it's basically useless. So instead, I have
  // to use this non-standard webkitdirectory input attribute that loads all files in a directory instead
  // of just selecting the directory itself. Yay.
  const onDataDirButtonClick = async (event: {
    target: { files: FileList | null };
  }) => {
    if (!workerPool) {
      return alert("Workers not loaded yet");
    }
    const files = event.target.files ?? [];
    const plugins = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (isPlugin(file)) {
        plugins.push(file);
      }
    }
    parsePluginFiles(plugins, workerPool);
  };

  return (
    <>
      <p className={styles["no-top-margin"]}>
        Select or drag-and-drop your{" "}
        <strong>
          <code>Data</code>
        </strong>{" "}
        directory below to load the plugins and see all of the cell edits and
        conflicts for your current mod load order.
      </p>
      <input
        type="file"
        webkitdirectory=""
        onChange={onDataDirButtonClick}
        style={{ display: "none" }}
        ref={inputRef}
      />
      {/* input webkitdirectory is buggy, so keep it hidden and control it through a normal button */}
      <button
        onClick={() => {
          if (inputRef.current) {
            inputRef.current.value = ""; // clear the value so reloading same directory works
            inputRef.current.click();
          }
        }}
        disabled={!workerPool || loading}
      >
        {loading ? "Loading" : plugins.length > 0 ? "Reload" : "Open"} Skyrim
        Data directory
      </button>
    </>
  );
};

export default DataDirPicker;
