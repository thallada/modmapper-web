import React, { useContext, useRef, useState, useEffect } from "react";
import Cookies from "js-cookie";

import { WorkerPoolContext } from "../lib/WorkerPool";
import { useAppSelector } from "../lib/hooks";
import { isPlugin, parsePluginFiles } from "../lib/plugins";
import styles from "../styles/DataDirPicker.module.css";
import { createPortal } from "react-dom";

type Props = {};

const DataDirPicker: React.FC<Props> = () => {
  const workerPool = useContext(WorkerPoolContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const plugins = useAppSelector((state) => state.plugins.plugins);
  const pluginsPending = useAppSelector((state) => state.plugins.pending);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadNoticeShown, setUploadNoticeShown] = useState(false);
  const [ignoreUploadNoticeChecked, setIgnoreUploadNoticeChecked] =
    useState(false);

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
    if (!workerPool || workerPool.availableWorkers.length === 0) {
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
      <p>
        <strong className={styles.step}>1. </strong>Select or drag-and-drop your
        Skyrim{" "}
        <strong>
          <code>Data</code>
        </strong>{" "}
        folder below to load the plugins and see all of the cell edits and
        conflicts for your current mod load order.
        <br />
        <br />
        The Data folder can be found in the installation directory of the game.
        <br />
        <br />
        For Mod Organizer users, select the mod directory located at{" "}
        <strong>
          <code className={styles["break-word"]}>
            C:\Users\username\AppData\Local\ModOrganizer\Skyrim Special
            Edition\mods
          </code>
        </strong>
        .
      </p>
      {typeof window !== "undefined" &&
        createPortal(
          <dialog open={uploadNoticeShown} className={styles.dialog}>
            <p>
              <strong>NOTE:</strong> the following dialog will ask you to upload
              all the files in your Data folder.&nbsp;
              <strong>NOTHING WILL BE UPLOADED ANYWHERE</strong>. The plugin
              files will only be transferred to your browser and processed on
              your device.
            </p>
            <p>
              Drag and drop the Data folder onto the web page to avoid the
              upload dialog entirely.
            </p>
            <label>
              <input
                type="checkbox"
                id="ignore-upload-notice"
                checked={ignoreUploadNoticeChecked}
                onChange={(event) => {
                  if (event.target.checked) {
                    setIgnoreUploadNoticeChecked(true);
                  } else {
                    setIgnoreUploadNoticeChecked(false);
                  }
                }}
              />{" "}
              Don&apos;t show this message again
            </label>
            <menu>
              <button
                onClick={() => {
                  setUploadNoticeShown(false);
                  if (ignoreUploadNoticeChecked) {
                    Cookies.set("ignoreDataDirPickerUploadNotice", "true");
                  }
                  if (inputRef.current) {
                    inputRef.current.click();
                  }
                }}
              >
                Ok
              </button>
            </menu>
          </dialog>,
          document.body
        )}
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
            if (Cookies.get("ignoreDataDirPickerUploadNotice") !== "true") {
              setUploadNoticeShown(true);
            } else {
              inputRef.current.click();
            }
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
