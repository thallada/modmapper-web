import React from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { formatRelative } from "date-fns";

import arrow from "../public/img/arrow.svg";
import close from "../public/img/close.svg";
import CellData from "./CellData";
import ModData from "./ModData";
import PluginDetail from "./PluginDetail";
import DataDirPicker from "./DataDirPicker";
import PluginTxtEditor from "./PluginTxtEditor";
import PluginsList from "./PluginsList";
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

    return <PluginDetail hash={plugin} counts={counts} />;
  };

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
        >
          <div className={styles["sidebar-content"]}>
            <div className={styles["sidebar-header"]}>
              <button className={styles.close} onClick={onClose}>
                <Image src={close} width={24} height={24} alt="close" />
              </button>
            </div>
            <h1 className={styles["cell-name-header"]}>
              Cell {selectedCell.x}, {selectedCell.y}
            </h1>
            {renderCellData(selectedCell)}
            {renderLastModified(lastModified)}
          </div>
        </div>
      );
    } else if (router.query.mod) {
      const modId = parseInt(router.query.mod as string, 10);
      return (
        <div
          className={styles.sidebar}
          style={!open ? { display: "none" } : {}}
        >
          <div className={styles["sidebar-content"]}>
            <div className={styles["sidebar-header"]}>
              <button className={styles.close} onClick={onClose}>
                <Image src={close} width={24} height={24} alt="close" />
              </button>
            </div>
            {!Number.isNaN(modId) && renderModData(modId)}
            {renderLastModified(lastModified)}
          </div>
        </div>
      );
    } else if (router.query.plugin) {
      return (
        <div
          className={styles.sidebar}
          style={!open ? { display: "none" } : {}}
        >
          <div className={styles["sidebar-content"]}>
            <div className={styles["sidebar-header"]}>
              <button className={styles.close} onClick={onClose}>
                <Image src={close} width={24} height={24} alt="close" />
              </button>
            </div>
            {renderPluginData(
              typeof router.query.plugin === "string"
                ? router.query.plugin
                : router.query.plugin[0]
            )}
            {renderLastModified(lastModified)}
          </div>
        </div>
      );
    } else {
      return (
        <div
          className={styles.sidebar}
          style={!open ? { display: "none" } : {}}
        >
          <div className={styles["sidebar-content"]}>
            <h1 className={styles.title}>Modmapper</h1>
            <p className={styles.subheader}>
              An interactive map of Skyrim mods.
            </p>
            <DataDirPicker />
            <PluginTxtEditor />
            <PluginsList />
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
          <Image src={arrow} alt="show" width={16} height={16} />
        </button>
      ) : (
        <button
          className={styles.hide}
          onClick={() => setOpen(false)}
          title="Hide sidebar"
        >
          <Image src={arrow} alt="hide" width={16} height={16} />
        </button>
      )}
      {renderOpenSidebar()}
    </>
  );
};

export default Sidebar;
