import { useEffect, useCallback, useState } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import "mapbox-gl/dist/mapbox-gl.css";

import Map from "../components/Map";
import { useAppDispatch } from "../lib/hooks";
import { isPlugin, isPluginPath, parsePluginFiles } from "../lib/plugins";
import { setPluginsTxtAndApplyLoadOrder } from "../slices/pluginsTxt";
import { WorkerPool, WorkerPoolContext } from "../lib/WorkerPool";

const Home: NextPage = () => {
  const [workerPool, setWorkerPool] = useState<WorkerPool | null>(null);
  const dispatch = useAppDispatch();

  const createWorkerPool = useCallback(async () => {
    setWorkerPool(
      await new WorkerPool().init(window.navigator.hardwareConcurrency)
    );
  }, []);

  useEffect(() => {
    return () => {
      if (workerPool) {
        workerPool.terminateAll();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    createWorkerPool();
  }, [createWorkerPool]);

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title key="title">Modmapper</title>
        <link rel="icon" href="/favicon.ico" />

        <meta
          key="description"
          name="description"
          content="Map of Skyrim mods"
        />
        <meta key="og:title" property="og:title" content="Modmapper" />
        <meta property="og:site_name" content="Modmapper"></meta>
        <meta
          key="og:description"
          property="og:description"
          content="Map of Skyrim mods"
        />
        <meta property="og:type" content="website" />
        <meta key="og:url" property="og:url" content="https://modmapper.com" />
        <meta
          property="og:image"
          content="https://modmapper.com/img/screenshot.jpg"
        />
        <meta
          property="og:image:alt"
          content="A screenshot of Modmapper displaying a map of Skyrim with a grid of cells overlayed colored green to red indicating how many mods edited each cell"
        />
        <meta key="twitter:title" name="twitter:title" content="Modmapper" />
        <meta
          key="twitter:description"
          name="twitter:description"
          content="Map of Skyrim mods"
        />
        <meta
          name="twitter:image"
          content="https://modmapper.com/img/screenshot.jpg"
        />
        <meta
          name="twitter:image:alt"
          content="A screenshot of Modmapper displaying a map of Skyrim with a grid of cells overlayed colored green to red indicating how many mods edited each cell"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@tyhallada" />
        <meta name="twitter:creator" content="@tyhallada" />
      </Head>
      <WorkerPoolContext.Provider value={workerPool}>
        <div
          style={{
            margin: 0,
            padding: 0,
            width: "100%",
            height: "100%",
          }}
          onDragOver={(evt) => {
            evt.preventDefault();
          }}
          onDrop={async (evt) => {
            evt.preventDefault();

            if (evt.dataTransfer.items && evt.dataTransfer.items.length > 0) {
              const item = evt.dataTransfer.items[0];
              if (item.kind === "file") {
                // Gotta love all these competing web file system standards...
                if (
                  (
                    item as DataTransferItem & {
                      getAsFileSystemHandle?: () => Promise<FileSystemHandle>;
                    }
                  ).getAsFileSystemHandle
                ) {
                  const entry = await (
                    item as DataTransferItem & {
                      getAsFileSystemHandle: () => Promise<FileSystemHandle>;
                    }
                  ).getAsFileSystemHandle();
                  if (entry.kind === "file") {
                    const file = await (
                      entry as FileSystemFileHandle
                    ).getFile();
                    dispatch(setPluginsTxtAndApplyLoadOrder(await file.text()));
                    return;
                  } else if (entry.kind === "directory") {
                    const plugins: { getFile: () => Promise<File> }[] = [];
                    const values = (
                      entry as FileSystemDirectoryHandle & { values: any }
                    ).values();
                    // I'm scared of yield and generators so I'm just going to do a lame while loop
                    while (true) {
                      const next = await values.next();
                      if (next.done) {
                        break;
                      }
                      if (
                        next.value.kind == "file" &&
                        isPluginPath(next.value.name)
                      ) {
                        plugins.push(next.value);
                      }
                    }
                    const pluginFiles = await Promise.all(
                      plugins.map(async (plugin) => plugin.getFile())
                    );
                    if (workerPool) {
                      parsePluginFiles(pluginFiles, workerPool);
                    } else {
                      alert("Workers not loaded yet");
                    }
                  }
                } else if (
                  (
                    item as DataTransferItem & {
                      webkitGetAsEntry?: FileSystemEntry | null;
                    }
                  ).webkitGetAsEntry
                ) {
                  const entry = item.webkitGetAsEntry();
                  if (entry?.isFile) {
                    (entry as FileSystemFileEntry).file(async (file) => {
                      dispatch(
                        setPluginsTxtAndApplyLoadOrder(await file.text())
                      );
                    });
                  } else if (entry?.isDirectory) {
                    const reader = (
                      entry as FileSystemDirectoryEntry
                    ).createReader();
                    const plugins = await new Promise<FileSystemFileEntry[]>(
                      (resolve, reject) => {
                        const plugins: FileSystemFileEntry[] = [];
                        reader.readEntries((entries) => {
                          entries.forEach((entry) => {
                            if (entry?.isFile && isPluginPath(entry.name)) {
                              plugins.push(entry as FileSystemFileEntry);
                            }
                          });
                          resolve(plugins);
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
                    if (workerPool) {
                      parsePluginFiles(pluginFiles, workerPool);
                    } else {
                      alert("Workers not loaded yet");
                    }
                  }
                } else {
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
          }}
        >
          <Map />
        </div>
      </WorkerPoolContext.Provider>
    </>
  );
};

export default Home;
