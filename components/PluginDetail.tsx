import React, { useEffect } from "react";
import useSWRImmutable from "swr/immutable";

import { useAppDispatch, useAppSelector } from "../lib/hooks";
import { setFetchedPlugin, PluginFile, PluginsByHashWithMods, Cell } from "../slices/plugins";
import PluginModList from "./PluginModList";
import PluginData, { Plugin as PluginProps } from "./PluginData";
import styles from "../styles/PluginData.module.css";

const jsonFetcher = async (url: string): Promise<PluginsByHashWithMods | null> => {
  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }
  return res.json();
};

const buildPluginProps = (data?: PluginsByHashWithMods | null, plugin?: PluginFile): PluginProps => {
  const dataPlugin = data && data.plugins.length > 0 && data.plugins[0];
  return {
    hash: (plugin && plugin.hash) || (dataPlugin && dataPlugin.hash.toString(36)) || "",
    size: plugin?.size || (dataPlugin && dataPlugin.size) || 0,
    author: plugin?.parsed?.header.author || (dataPlugin && dataPlugin.author) || undefined,
    description: plugin?.parsed?.header.description || (dataPlugin && dataPlugin.description) || undefined,
    masters: plugin?.parsed?.header.masters || (dataPlugin && dataPlugin.masters) || [],
    file_name: plugin?.filename || (dataPlugin && dataPlugin.file_name) || "",
    cell_count: plugin?.parsed?.cells.length || (data && data.cells.length) || 0,
  }
}

type Props = {
  hash: string;
  counts: Record<number, [number, number, number]> | null;
};

const PluginDetail: React.FC<Props> = ({ hash, counts }) => {
  const { data, error } = useSWRImmutable(
    `https://plugins.modmapper.com/${hash}.json`,
    jsonFetcher
  );

  const dispatch = useAppDispatch();
  const plugins = useAppSelector((state) => state.plugins.plugins);
  const fetchedPlugin = useAppSelector((state) => state.plugins.fetchedPlugin);
  const plugin = plugins.find((plugin) => plugin.hash === hash);

  useEffect(() => {
    if (data) {
      dispatch(setFetchedPlugin(data));
    }
  }, [dispatch, data, fetchedPlugin])

  if (!plugin && error && error.status === 404) {
    return <h3>Plugin could not be found.</h3>;
  } else if (!plugin && error) {
    return <div>{`Error loading plugin data: ${error.message}`}</div>;
  }
  if (!plugin && data === undefined)
    return <div className={styles.status}>Loading...</div>;
  if (!plugin && data === null)
    return <div className={styles.status}>Plugin could not be found.</div>;

  return (
    <>
      <PluginData
        plugin={buildPluginProps(data, plugin)}
        counts={counts}
      />
      {data && <PluginModList mods={data.mods} files={data.files} counts={counts} />}
    </>
  );
};

export default PluginDetail;
