import Head from "next/head";
import React from "react";

import { useAppSelector } from "../lib/hooks";
import styles from "../styles/PluginData.module.css";

export interface CellCoord {
  x: number;
  y: number;
}

const NEXUS_MODS_URL = "https://www.nexusmods.com/skyrimspecialedition";

type Props = {
  hash: string;
  counts: Record<number, [number, number, number]> | null;
};

const PluginData: React.FC<Props> = ({ hash, counts }) => {
  const plugins = useAppSelector((state) => state.plugins.plugins);
  const plugin = plugins.find((plugin) => plugin.hash === hash);

  if (!plugin) {
    return <h3>Plugin could not be found</h3>;
  }

  return (
    <>
      <Head>
        <title key="title">{`Modmapper - ${plugin.filename}`}</title>
        <meta
          key="description"
          name="description"
          content={`Map of Skyrim showing ${
            plugin.parsed ? plugin.parsed.cells.length : 0
          } cell edits from the plugin: ${plugin.filename}`}
        />
        <meta
          key="og:title"
          property="og:title"
          content={`Modmapper - ${plugin.filename}`}
        />
        <meta
          key="og:description"
          property="og:description"
          content={`Map of Skyrim showing ${
            plugin.parsed ? plugin.parsed.cells.length : 0
          } cell edits from the plugin: ${plugin.filename}`}
        />
        <meta
          key="twitter:title"
          name="twitter:title"
          content={`Modmapper - ${plugin.filename}`}
        />
        <meta
          key="twitter:description"
          name="twitter:description"
          content={`Map of Skyrim showing ${
            plugin.parsed ? plugin.parsed.cells.length : 0
          } cell edits from the plugin: ${plugin.filename}`}
        />
        <meta
          key="og:url"
          property="og:url"
          content={`https://modmapper.com/?plugin=${plugin.hash}`}
        />
      </Head>
      <h1 className={styles.name}>{plugin.filename}</h1>
      {plugin.parsed && (
        <div>
          <strong>Version:&nbsp;</strong>
          {plugin.parsed.header.version}
        </div>
      )}
      {plugin.parsed && plugin.parsed.header.author && (
        <div>
          <strong>Author:&nbsp;</strong>
          {plugin.parsed.header.author}
        </div>
      )}
      {plugin.parsed && plugin.parsed.header.masters && (
        <div>
          <strong>Master plugins:&nbsp;</strong>
          {plugin.parsed.header.masters.join(", ")}
        </div>
      )}
      {plugin.parsed && (
        <div>
          <strong>Cell edits:&nbsp;</strong>
          {plugin.parsed.cells.length}
        </div>
      )}
      {plugin.parsed && (
        <div>
          <strong>World edits:&nbsp;</strong>
          {plugin.parsed.worlds.length}
        </div>
      )}
      {plugin.parsed && plugin.parsed.header.description && (
        <div>
          <h3>Description:</h3>
          <p>{plugin.parsed.header.description}</p>
        </div>
      )}
      {plugin.parseError && (
        <div>
          <h3>Failed to parse plugin:</h3>
          <p>{plugin.parseError}</p>
        </div>
      )}
    </>
  );
};

export default PluginData;
