/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import React from "react";

import { useAppSelector, useAppDispatch } from "../lib/hooks";
import {
  disableAllFetchedPlugins,
  enableAllFetchedPlugins,
  toggleFetchedPlugin,
  removeFetchedPlugin,
} from "../slices/plugins";
import styles from "../styles/FetchedPluginsList.module.css";

type Props = {
  selectedCell?: { x: number; y: number };
};

const FetchedPluginsList: React.FC<Props> = ({ selectedCell }) => {
  const dispatch = useAppDispatch();
  const plugins = useAppSelector((state) =>
    selectedCell
      ? state.plugins.fetchedPlugins.filter((plugin) =>
          plugin.cells.some(
            (cell) => cell.x === selectedCell.x && cell.y === selectedCell.y
            // TODO: support other worlds
          )
        )
      : state.plugins.fetchedPlugins
  );

  return (
    <>
      {plugins.length > 0 && <h2>Added Plugins ({plugins.length})</h2>}
      {!selectedCell && plugins.length > 0 && (
        <div className={styles.buttons}>
          <button onClick={() => dispatch(enableAllFetchedPlugins())}>
            Enable all
          </button>
          <button onClick={() => dispatch(disableAllFetchedPlugins())}>
            Disable all
          </button>
        </div>
      )}
      <ol
        className={`${styles["plugin-list"]} ${
          plugins.length > 0 ? styles["bottom-spacing"] : ""
        }`}
      >
        {plugins.map((plugin) => (
          <li
            key={plugin.hash}
            title={plugin.plugins[0].file_name}
            className={styles["plugin-row"]}
          >
            <input
              id={plugin.hash}
              type="checkbox"
              checked={plugin.enabled ?? false}
              value={plugin.enabled ? "on" : "off"}
              onChange={() => dispatch(toggleFetchedPlugin(plugin.hash))}
            />
            <label htmlFor={plugin.hash} className={styles["plugin-label"]}>
              <Link href={`/?plugin=${plugin.hash}`}>
                <a>{plugin.plugins[0].file_name}</a>
              </Link>
            </label>
            <button
              onClick={() => dispatch(removeFetchedPlugin(plugin.hash))}
              className={styles["plugin-remove"]}
            >
              <img src="/img/close.svg" width={18} height={18} alt="close" />
            </button>
          </li>
        ))}
      </ol>
    </>
  );
};

export default FetchedPluginsList;
