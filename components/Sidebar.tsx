/* eslint-disable @next/next/no-img-element */
import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { formatRelative } from "date-fns";

import AddModDialog from "./AddModDialog";
import CellData from "./CellData";
import ModData from "./ModData";
import PluginDetail from "./PluginDetail";
import DataDirPicker from "./DataDirPicker";
import PluginTxtEditor from "./PluginTxtEditor";
import ParsedPluginsList from "./ParsedPluginsList";
import FetchedPluginsList from "./FetchedPluginsList";
import styles from "../styles/Sidebar.module.css";

type Props = {
  selectedCell: { x: number; y: number } | null;
  clearSelectedCell: () => void;
  setSelectedCells: (cells: { x: number; y: number }[] | null) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  lastModified: string | null | undefined;
  onSelectFile: (fileId: number) => void;
  onSelectPlugin: (hash: string) => void;
};

const Sidebar: React.FC<Props> = ({
  selectedCell,
  clearSelectedCell,
  setSelectedCells,
  open,
  setOpen,
  lastModified,
  onSelectFile,
  onSelectPlugin,
}) => {
  const router = useRouter();

  useEffect(() => {
    document.getElementById("sidebar")?.scrollTo(0, 0);
  }, [selectedCell, router.query.mod, router.query.plugin]);

  const renderLastModified = (lastModified: string | null | undefined) => {
    if (lastModified) {
      return (
        <div className={styles["sidebar-modified-date"]}>
          <strong>Site last updated:</strong>{" "}
          {formatRelative(new Date(lastModified), new Date())}
        </div>
      );
    }
  };

  const renderOpenSidebar = () => {
    if (selectedCell) {
      return (
        <div
          className={styles.sidebar}
          style={!open ? { display: "none" } : {}}
          id="sidebar"
        >
          <div className={styles["sidebar-content"]}>
            <div className={styles["sidebar-header"]}>
              <button className={styles.close} onClick={onClose}>
                <img src="/img/close.svg" width={24} height={24} alt="close" />
              </button>
            </div>
            <h1 className={styles["cell-name-header"]}>
              Cell {selectedCell.x}, {selectedCell.y}
            </h1>
            <CellData selectedCell={selectedCell} />;
            {renderLastModified(lastModified)}
          </div>
        </div>
      );
    } else if (router.query.mod) {
      const modId = parseInt(router.query.mod as string, 10);
      const fileId = parseInt(router.query.file as string, 10);
      const pluginHash = router.query.plugin as string;
      return (
        <div
          className={styles.sidebar}
          style={!open ? { display: "none" } : {}}
          id="sidebar"
        >
          <div className={styles["sidebar-content"]}>
            <div className={styles["sidebar-header"]}>
              <button className={styles.close} onClick={onClose}>
                <img src="/img/close.svg" width={24} height={24} alt="close" />
              </button>
            </div>
            {!Number.isNaN(modId) && (
              <ModData
                selectedMod={modId}
                selectedFile={fileId}
                selectedPlugin={pluginHash}
                setSelectedCells={setSelectedCells}
                onSelectFile={onSelectFile}
                onSelectPlugin={onSelectPlugin}
              />
            )}
            {renderLastModified(lastModified)}
          </div>
        </div>
      );
    } else if (router.query.plugin) {
      return (
        <div
          className={styles.sidebar}
          style={!open ? { display: "none" } : {}}
          id="sidebar"
        >
          <div className={styles["sidebar-content"]}>
            <div className={styles["sidebar-header"]}>
              <button className={styles.close} onClick={onClose}>
                <img src="/img/close.svg" width={24} height={24} alt="close" />
              </button>
            </div>
            <PluginDetail
              hash={
                typeof router.query.plugin === "string"
                  ? router.query.plugin
                  : router.query.plugin[0]
              }
            />
            ;{renderLastModified(lastModified)}
          </div>
        </div>
      );
    } else {
      return (
        <div
          className={styles.sidebar}
          style={!open ? { display: "none" } : {}}
          id="sidebar"
        >
          <div className={styles["sidebar-content"]}>
            <h1 className={styles.title}>Modmapper</h1>
            <p className={styles.subheader}>
              An interactive map of Skyrim mods.
            </p>
            <DataDirPicker />
            <PluginTxtEditor />
            <ParsedPluginsList />
            <FetchedPluginsList />
            <AddModDialog />
            {renderLastModified(lastModified)}
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
        >
          <img src="/img/arrow.svg" alt="show" width={16} height={16} />
        </button>
      ) : (
        <button
          className={styles.hide}
          onClick={() => setOpen(false)}
          title="Hide sidebar"
        >
          <img src="/img/arrow.svg" alt="hide" width={16} height={16} />
        </button>
      )}
      {renderOpenSidebar()}
    </>
  );
};

export default Sidebar;
