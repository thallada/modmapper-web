import React from "react";
import { useRouter } from "next/router";
import { formatRelative } from "date-fns";

import CellData from "./CellData";
import ModData from "./ModData";
import PluginData from "./PluginData";
import PluginsLoader from "./PluginsLoader";
import styles from "../styles/Sidebar.module.css";

type Props = {
  selectedCell: { x: number; y: number } | null;
  clearSelectedCell: () => void;
  setSelectedCells: (cells: { x: number; y: number }[] | null) => void;
  counts: Record<number, [number, number, number]> | null;
  countsError: Error | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  lastModified: string | null | undefined;
};

const Sidebar: React.FC<Props> = ({
  selectedCell,
  clearSelectedCell,
  setSelectedCells,
  counts,
  countsError,
  open,
  setOpen,
  lastModified,
}) => {
  const router = useRouter();

  const renderLoadError = (error: Error) => (
    <div>{`Error loading live download counts: ${error.message}`}</div>
  );

  const renderLoading = () => <div>Loading...</div>;

  const renderCellData = (selectedCell: { x: number; y: number }) => {
    if (countsError) return renderLoadError(countsError);
    if (!counts) return renderLoading();

    return <CellData selectedCell={selectedCell} counts={counts} />;
  };

  const renderModData = (selectedMod: number) => {
    if (countsError) return renderLoadError(countsError);
    if (!counts) return renderLoading();

    return (
      <ModData
        selectedMod={selectedMod}
        counts={counts}
        setSelectedCells={setSelectedCells}
      />
    );
  };

  const renderPluginData = (plugin: string) => {
    if (countsError) return renderLoadError(countsError);
    if (!counts) return renderLoading();

    return <PluginData hash={plugin} counts={counts} />;
  };

  const renderOpenSidebar = () => {
    if (selectedCell) {
      return (
        <div
          className={styles.sidebar}
          style={!open ? { display: "none" } : {}}
        >
          <div className={styles["sidebar-header"]}>
            <button className={styles.close} onClick={onClose}>
              ✖
            </button>
          </div>
          <h1 className={styles["cell-name-header"]}>
            Cell {selectedCell.x}, {selectedCell.y}
          </h1>
          {renderCellData(selectedCell)}
        </div>
      );
    } else if (router.query.mod) {
      const modId = parseInt(router.query.mod as string, 10);
      return (
        <div
          className={styles.sidebar}
          style={!open ? { display: "none" } : {}}
        >
          <div className={styles["sidebar-header"]}>
            <button className={styles.close} onClick={onClose}>
              ✖
            </button>
          </div>
          {!Number.isNaN(modId) && renderModData(modId)}
        </div>
      );
    } else if (router.query.plugin) {
      return (
        <div
          className={styles.sidebar}
          style={!open ? { display: "none" } : {}}
        >
          <div className={styles["sidebar-header"]}>
            <button className={styles.close} onClick={onClose}>
              ✖
            </button>
          </div>
          {renderPluginData(
            typeof router.query.plugin === "string"
              ? router.query.plugin
              : router.query.plugin[0]
          )}
        </div>
      );
    } else {
      return (
        <div
          className={styles.sidebar}
          style={!open ? { display: "none" } : {}}
        >
          <div className={styles["default-sidebar"]}>
            <h2>Modmapper</h2>
            <p className={styles.subheader}>
              An interactive map of Skyrim mods.
            </p>
            <PluginsLoader />
            {lastModified && (
              <div className={styles["sidebar-modified-date"]}>
                <strong>Last updated:</strong>{" "}
                {formatRelative(new Date(lastModified), new Date())}
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  const onClose = () => {
    clearSelectedCell();
  };

  return (
    <>
      {!open ? (
        <button
          className={styles.open}
          onClick={() => setOpen(true)}
          title="Show sidebar"
        ></button>
      ) : (
        <button
          className={styles.hide}
          onClick={() => setOpen(false)}
          title="Hide sidebar"
        ></button>
      )}
      {renderOpenSidebar()}
    </>
  );
};

export default Sidebar;
