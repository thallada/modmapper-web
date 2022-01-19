import { format } from "date-fns";
import React from "react";
import useSWRImmutable from "swr/immutable";

import styles from "../styles/CellModList.module.css";
import type { Mod } from "./CellData";

const NEXUS_MODS_URL = "https://www.nexusmods.com/skyrimspecialedition";
const LIVE_DOWNLOAD_COUNTS_URL =
  "https://staticstats.nexusmods.com/live_download_counts/mods/1704.csv";

const csvFetcher = (url: string) => fetch(url).then((res) => res.text());

type Props = {
  mods: Mod[];
};

type ModWithCounts = Mod & {
  total_downloads: number;
  unique_downloads: number;
  views: number;
};

const CellModList: React.FC<Props> = ({ mods }) => {
  // The live download counts are not really immutable, but I'd still rather load them once per session
  const { data, error } = useSWRImmutable(LIVE_DOWNLOAD_COUNTS_URL, csvFetcher);

  if (error)
    return <div>{`Error loading live download counts: ${error.message}`}</div>;
  if (!data) return <div>Loading...</div>;

  const counts = data
    .split("\n")
    .map((line) => line.split(",").map((count) => parseInt(count, 10)));

  const modsWithCounts: ModWithCounts[] = mods.map((mod) => {
    const modCounts = counts.find((count) => count[0] === mod.nexus_mod_id);
    return {
      ...mod,
      total_downloads: modCounts ? modCounts[1] : 0,
      unique_downloads: modCounts ? modCounts[2] : 0,
      views: modCounts ? modCounts[3] : 0,
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
                    <a
                      href={`${NEXUS_MODS_URL}/mods/${mod.nexus_mod_id}`}
                      className={styles.link}
                    >
                      {mod.name}
                    </a>
                  </strong>
                </div>
                <div>
                  <strong>Category:&nbsp;</strong>
                  <a
                    href={`${NEXUS_MODS_URL}/mods/categories/${mod.category_id}`}
                    className={styles.link}
                  >
                    {mod.category_name}
                  </a>
                </div>
                <div>
                  <strong>Author:&nbsp;</strong>
                  <a
                    href={`${NEXUS_MODS_URL}/users/${mod.author_id}`}
                    className={styles.link}
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
