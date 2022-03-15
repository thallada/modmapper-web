import { format } from "date-fns";
import React from "react";
import Link from "next/link";

import styles from "../styles/CellModList.module.css";
import type { Mod } from "./CellData";

const NEXUS_MODS_URL = "https://www.nexusmods.com/skyrimspecialedition";

type Props = {
  mods: Mod[];
  counts: Record<number, [number, number, number]> | null;
};

type ModWithCounts = Mod & {
  total_downloads: number;
  unique_downloads: number;
  views: number;
};

const CellModList: React.FC<Props> = ({ mods, counts }) => {
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
        <h2>Nexus Mods ({modsWithCounts.length})</h2>
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
              </li>
            ))}
        </ul>
      </>
    )
  );
};

export default CellModList;
