import React from "react";
import Link from "next/link";

import styles from "../styles/ModCellList.module.css";
import type { CellCoord } from "./ModData";

const NEXUS_MODS_URL = "https://www.nexusmods.com/skyrimspecialedition";

type Props = {
  cells: CellCoord[];
};

const ModCellList: React.FC<Props> = ({ cells }) => {
  return (
    cells && (
      <>
        <h2>Cells ({cells.length})</h2>
        <ul className={styles["cell-list"]}>
          {cells
            // .sort((a, b) => b.unique_downloads - a.unique_downloads)
            .map((cell) => (
              <li
                key={`cell-${cell.x},${cell.y}`}
                className={styles["cell-list-item"]}
              >
                <div className={styles["cell-title"]}>
                  <strong>
                    <Link
                      href={`/?cell=${encodeURIComponent(
                        `${cell.x},${cell.y}`
                      )}`}
                    >
                      <a className={styles.link}>
                        {cell.x}, {cell.y}
                      </a>
                    </Link>
                  </strong>
                </div>
              </li>
            ))}
        </ul>
      </>
    )
  );
};

export default ModCellList;
