import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import MiniSearch from "minisearch";
import ReactPaginate from "react-paginate";

import styles from "../styles/CellList.module.css";
import type { CellCoord } from "./ModData";

const PAGE_SIZE = 100;

type Props = {
  cells: CellCoord[];
};

const CellList: React.FC<Props> = ({ cells }) => {
  const cellSearch = useRef<MiniSearch<CellCoord> | null>(
    null
  ) as React.MutableRefObject<MiniSearch<CellCoord>>;

  useEffect(() => {
    cellSearch.current = new MiniSearch({
      fields: ["id"],
      storeFields: ["id", "x", "y"],
      tokenize: (s) => [s.replace(/cell\s?|\s/gi, "")],
      searchOptions: {
        fields: ["id"],
        prefix: true,
        fuzzy: false,
      },
    });
    cellSearch.current.addAll(
      cells.map((cell) => ({ ...cell, id: `${cell.x},${cell.y}` }))
    );
  }, [cells]);

  const [filter, setFilter] = useState<string>("");
  const [filterResults, setFilterResults] = useState<Set<string>>(new Set());
  const [page, setPage] = useState<number>(0);

  const filteredCells = cells
    .filter((cell) => !filter || filterResults.has(`${cell.x},${cell.y}`))
    .sort((a, b) => (a.x - b.x) * 1000 + a.y - b.y);

  useEffect(() => {
    if (cellSearch.current) {
      setFilterResults(
        new Set(cellSearch.current.search(filter).map((result) => result.id))
      );
    }
  }, [filter]);

  useEffect(() => {
    setPage(0);
  }, [filterResults]);

  const renderPagination = () => (
    <ReactPaginate
      breakLabel="..."
      nextLabel=">"
      forcePage={page}
      onPageChange={(event) => {
        setPage(event.selected);
        document.getElementById("sidebar")?.scrollTo(0, 0);
      }}
      pageRangeDisplayed={3}
      marginPagesDisplayed={2}
      pageCount={Math.ceil(filteredCells.length / PAGE_SIZE)}
      previousLabel="<"
      renderOnZeroPageCount={() => null}
      className={styles.pagination}
      activeClassName={styles["active-page"]}
      hrefBuilder={() => "#"}
    />
  );

  return (
    filteredCells && (
      <>
        <h2>Exterior Cells ({filteredCells.length})</h2>
        <div className={styles.filters}>
          <hr />
          <div className={styles["filter-row"]}>
            <label htmlFor="filter">Filter:</label>
            <input
              type="search"
              id="filter"
              className={styles.filter}
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>
          <hr />
        </div>
        {renderPagination()}
        <ul className={styles["cell-list"]}>
          {filteredCells
            .slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
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
                      <a>
                        {cell.x}, {cell.y}
                      </a>
                    </Link>
                  </strong>
                </div>
              </li>
            ))}
        </ul>
        {renderPagination()}
      </>
    )
  );
};

export default CellList;
