import { useEffect, useCallback, useState } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import "mapbox-gl/dist/mapbox-gl.css";

import Map from "../components/Map";
import { useAppDispatch } from "../lib/hooks";
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
              const file = evt.dataTransfer.items[0].getAsFile();
              if (file) {
                dispatch(setPluginsTxtAndApplyLoadOrder(await file.text()));
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
