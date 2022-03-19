import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";

import { WorkerPool } from "../lib/WorkerPool";
import { isPluginPath, parsePluginFiles } from "../lib/plugins";
import { setPluginsTxtAndApplyLoadOrder } from "../slices/pluginsTxt";
import { useAppDispatch } from "../lib/hooks";
import styles from "../styles/DropZone.module.css";

type Props = {
  children?: React.ReactNode;
  workerPool: WorkerPool | null;
};

export const DropZone: React.FC<Props> = ({ children, workerPool }) => {
  const dispatch = useAppDispatch();
  const [entered, setEntered] = useState(0);
  const overlay = useRef<HTMLDivElement>(null);

  const findPluginsInDirHandle = async (
    dirHandle: FileSystemDirectoryHandle & { values: any }
  ) => {
    const plugins: { getFile: () => Promise<File> }[] = [];
    const values = dirHandle.values();
    // I'm scared of yield and generators so I'm just going to do a lame while loop
    while (true) {
      const next = await values.next();
      if (next.done) {
        break;
      }
      if (next.value.kind === "file" && isPluginPath(next.value.name)) {
        plugins.push(next.value);
      } else if (
        next.value.kind === "directory" &&
        next.value.name === "Data"
      ) {
        plugins.push(...(await findPluginsInDirHandle(next.value)));
      }
    }
    return plugins;
  };

  const handleDropFileSystemHandle = async (
    item: DataTransferItem
  ): Promise<boolean> => {
    if (!item.getAsFileSystemHandle) {
      return false;
    }
    const entry = await item.getAsFileSystemHandle();
    if (entry?.kind === "file") {
      const file = await (entry as FileSystemFileHandle).getFile();
      dispatch(setPluginsTxtAndApplyLoadOrder(await file.text()));
      return true;
    } else if (entry?.kind === "directory") {
      const plugins = await findPluginsInDirHandle(
        entry as FileSystemDirectoryHandle & { values: any }
      );
      const pluginFiles = await Promise.all(
        plugins.map(async (plugin) => plugin.getFile())
      );
      if (workerPool && workerPool.availableWorkers.length > 0) {
        parsePluginFiles(pluginFiles, workerPool);
      } else {
        alert("Workers not loaded yet");
      }
      return true;
    }
    return false;
  };

  const handleDropWebkitEntry = async (
    item: DataTransferItem
  ): Promise<boolean> => {
    if (!item.webkitGetAsEntry) {
      return false;
    }
    const entry = item.webkitGetAsEntry();
    if (entry?.isFile) {
      (entry as FileSystemFileEntry).file(async (file) => {
        dispatch(setPluginsTxtAndApplyLoadOrder(await file.text()));
      });
      return true;
    } else if (entry?.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const plugins = await new Promise<FileSystemFileEntry[]>(
        (resolve, reject) => {
          const plugins: FileSystemFileEntry[] = [];
          reader.readEntries((entries) => {
            let isData = true;
            entries.forEach((entry) => {
              if (entry?.isFile && isPluginPath(entry.name)) {
                plugins.push(entry as FileSystemFileEntry);
              } else if (entry?.isDirectory && entry.name === "Data") {
                isData = false;
                const dataReader = (
                  entry as FileSystemDirectoryEntry
                ).createReader();
                dataReader.readEntries((entries) => {
                  entries.forEach((entry) => {
                    if (entry?.isFile && isPluginPath(entry.name)) {
                      plugins.push(entry as FileSystemFileEntry);
                    }
                  });
                  resolve(plugins);
                });
              }
            });
            if (isData) resolve(plugins);
          }, reject);
        }
      );
      const pluginFiles = await Promise.all(
        plugins.map(
          (plugin) =>
            new Promise<File>((resolve, reject) =>
              plugin.file((file) => resolve(file), reject)
            )
        )
      );
      if (workerPool && workerPool.availableWorkers.length > 0) {
        parsePluginFiles(pluginFiles, workerPool);
      } else {
        alert("Workers not loaded yet");
      }
      return true;
    }
    return false;
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setEntered(0);

    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      const item = event.dataTransfer.items[0];
      if (item.kind === "file") {
        // Gotta love all these competing web file system standards...
        let processed = await handleDropFileSystemHandle(item);
        if (!processed) {
          processed = await handleDropWebkitEntry(item);
        }
        if (!processed) {
          const file = item.getAsFile();
          if (file) {
            dispatch(setPluginsTxtAndApplyLoadOrder(await file.text()));
          }
        }
      } else if (item.kind === "string") {
        item.getAsString((str) => {
          dispatch(setPluginsTxtAndApplyLoadOrder(str));
        });
      }
    }
  };

  return (
    <>
      <div id="drop-zone-overlay" ref={overlay} />
      {overlay.current && entered > 0
        ? createPortal(
            <div className={styles.overlay}>
              Drop Skyrim Data folder or plugins.txt file
            </div>,
            overlay.current
          )
        : null}
      <div
        className={styles["drop-zone"]}
        onDragOver={(event) => event.preventDefault()}
        onDragEnter={() => setEntered((entered) => entered + 1)}
        onDragLeave={() => setEntered((entered) => entered - 1)}
        onDrop={handleDrop}
      >
        {children}
      </div>
    </>
  );
};
