import { format } from "date-fns";
import React from "react";
import Link from "next/link";

import styles from "../styles/PluginModList.module.css";
import type { Mod } from "./CellData";
import type { File } from "../slices/plugins";
import { formatBytes } from "../lib/plugins";

const NEXUS_MODS_URL = "https://www.nexusmods.com/skyrimspecialedition";

type Props = {
  mods: Mod[];
  files: File[];
  counts: Record<number, [number, number, number]> | null;
};

type ModWithCounts = Mod & {
  total_downloads: number;
  unique_downloads: number;
  views: number;
};

const PluginModList: React.FC<Props> = ({ mods, files, counts }) => {
  const modsWithCounts: ModWithCounts[] = mods.map((mod) => {
    const modCounts = counts && counts[mod.nexus_mod_id];
    return {
      ...mod,
      total_downloads: modCounts ? modCounts[0] : 0,
      unique_downloads: modCounts ? modCounts[1] : 0,
      views: modCounts ? modCounts[2] : 0,
    };
  });

  let numberFmt = new Intl.NumberFormat("en-US");

  return (
    mods && (
      <>
        <h2>Mods</h2>
        <ul className={styles["mod-list"]}>
          {modsWithCounts
            .sort((a, b) => b.unique_downloads - a.unique_downloads)
            .map((mod) => (
              <li key={mod.id} className={styles["mod-list-item"]}>
                <div className={styles["mod-title"]}>
                  <strong>
                    <Link href={`/?mod=${mod.nexus_mod_id}`}>
                      <a>{mod.name}</a>
                    </Link>
                  </strong>
                </div>
                <div>
                  <a
                    href={`${NEXUS_MODS_URL}/mods/${mod.nexus_mod_id}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    View on Nexus Mods
                  </a>
                </div>
                <div>
                  <strong>Category:&nbsp;</strong>
                  <a
                    href={`${NEXUS_MODS_URL}/mods/categories/${mod.category_id}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {mod.category_name}
                  </a>
                </div>
                <div>
                  <strong>Author:&nbsp;</strong>
                  <a
                    href={`${NEXUS_MODS_URL}/users/${mod.author_id}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {mod.author_name}
                  </a>
                </div>
                <div>
                  <strong>Uploaded:</strong>{" "}
                  {format(new Date(mod.first_upload_at), "d MMM y")}
                </div>
                <div>
                  <strong>Last Update:</strong>{" "}
                  {format(new Date(mod.last_update_at), "d MMM y")}
                </div>
                <div>
                  <strong>Total Downloads:</strong>{" "}
                  {numberFmt.format(mod.total_downloads)}
                </div>
                <div>
                  <strong>Unique Downloads:</strong>{" "}
                  {numberFmt.format(mod.unique_downloads)}
                </div>
                <ul className={styles["file-list"]}>
                  {files.filter(file => file.mod_id === mod.id).map(file => (
                    <li key={file.id}>
                      <div>
                        <strong>File:</strong>{" "}
                        {file.name}
                      </div>
                      {file.mod_version && (
                        <div>
                          <strong>Version:</strong>{" "}
                          {file.mod_version}
                        </div>
                      )}
                      {file.version && file.mod_version !== file.version && (
                        <div>
                          <strong>File Version:</strong>{" "}
                          {file.version}
                        </div>
                      )}
                      {file.category && (
                        <div>
                          <strong>Category:</strong>{" "}
                          {file.category}
                        </div>
                      )}
                      <div>
                        <strong>Size:</strong>{" "}
                        {formatBytes(file.size)}
                      </div>
                      {file.uploaded_at && (
                        <div>
                          <strong>Uploaded:</strong>{" "}
                          {format(new Date(file.uploaded_at), "d MMM y")}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
        </ul>
      </>
    )
  );
};

export default PluginModList;
