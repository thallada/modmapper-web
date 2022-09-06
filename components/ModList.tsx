/* eslint-disable @next/next/no-img-element */
import { format } from "date-fns";
import React, { useContext, useEffect, useRef, useState } from "react";
import MiniSearch from "minisearch";
import Link from "next/link";
import useSWRImmutable from "swr/immutable";
import ReactPaginate from "react-paginate";

import styles from "../styles/ModList.module.css";
import type { Mod } from "./CellData";
import type { File } from "../slices/plugins";
import { formatBytes } from "../lib/plugins";
import { jsonFetcher } from "../lib/api";
import {
  ModWithCounts,
  setSortBy,
  setSortAsc,
  setFilter,
  setGame,
  setCategory,
  setIncludeTranslations,
} from "../slices/modListFilters";
import { editionNames } from "../lib/games";
import { useAppDispatch, useAppSelector } from "../lib/hooks";
import { DownloadCountsContext } from "./DownloadCountsProvider";
import { GamesContext } from "./GamesProvider";

const NEXUS_MODS_URL = "https://www.nexusmods.com";
const PAGE_SIZE = 50;

type Props = {
  mods: Mod[];
  files?: File[];
};

const ModList: React.FC<Props> = ({ mods, files }) => {
  const {
    games,
    getGameNameById,
    error: gamesError,
  } = useContext(GamesContext);
  const counts = useContext(DownloadCountsContext);
  const dispatch = useAppDispatch();
  const { sortBy, sortAsc, filter, category, game, includeTranslations } =
    useAppSelector((state) => state.modListFilters);
  const [filterResults, setFilterResults] = useState<Set<number>>(new Set());
  const [page, setPage] = useState<number>(0);

  const { data: cellCounts, error: cellCountsError } = useSWRImmutable(
    `https://mods.modmapper.com/mod_cell_counts.json`,
    (_) => jsonFetcher<Record<string, number>>(_)
  );

  const modsWithCounts: ModWithCounts[] = mods
    .map((mod) => {
      const gameName = getGameNameById(mod.game_id);
      const gameDownloadCounts = gameName && counts[gameName].counts;
      const modCounts =
        gameDownloadCounts && gameDownloadCounts[mod.nexus_mod_id];
      return {
        ...mod,
        total_downloads: modCounts ? modCounts[0] : 0,
        unique_downloads: modCounts ? modCounts[1] : 0,
        views: modCounts ? modCounts[2] : 0,
        exterior_cells_edited: cellCounts
          ? cellCounts[mod.nexus_mod_id] ?? 0
          : 0,
      };
    })
    .filter(
      (mod) =>
        (includeTranslations || !mod.is_translation) &&
        (!filter || filterResults.has(mod.id)) &&
        (game === "All" || getGameNameById(mod.game_id) === game) &&
        (category === "All" || mod.category_name === category)
    )
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortAsc ? aVal - bVal : bVal - aVal;
      } else if (
        typeof aVal === "string" &&
        typeof bVal === "string" &&
        ["first_upload_at", "last_update_at"].includes(sortBy)
      ) {
        const aTime = new Date(aVal).getTime();
        const bTime = new Date(bVal).getTime();
        return sortAsc ? aTime - bTime : bTime - aTime;
      } else if (typeof aVal === "string" && typeof bVal === "string") {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });

  let numberFmt = new Intl.NumberFormat("en-US");

  const renderDownloadCountsLoading = () => (
    <div>Loading live download counts...</div>
  );
  const renderDownloadCountsError = (error: Error) => (
    <div>{`Error loading live download counts: ${error.message}`}</div>
  );
  const renderGamesError = (error?: Error) =>
    error ? (
      <div>{`Error loading games: ${error.message}`}</div>
    ) : (
      <div>Error loading games</div>
    );

  const modSearch = useRef<MiniSearch<Mod> | null>(
    null
  ) as React.MutableRefObject<MiniSearch<Mod>>;

  useEffect(() => {
    modSearch.current = new MiniSearch({
      fields: ["name"],
      storeFields: ["name", "id"],
      searchOptions: {
        fields: ["name"],
        fuzzy: 0.2,
        prefix: true,
      },
    });
    modSearch.current.addAll(mods);
  }, [mods]);

  useEffect(() => {
    if (modSearch.current) {
      setFilterResults(
        new Set(
          modSearch.current.search(filter ?? "").map((result) => result.id)
        )
      );
    }
  }, [filter]);

  useEffect(() => {
    setPage(0);
  }, [filterResults, category, includeTranslations, sortBy, sortAsc]);

  const renderPagination = () => (
    <ReactPaginate
      breakLabel="..."
      nextLabel=">"
      forcePage={page}
      onPageChange={(event) => {
        setPage(event.selected);
        document.getElementById("nexus-mods")?.scrollIntoView();
      }}
      pageRangeDisplayed={3}
      marginPagesDisplayed={2}
      pageCount={Math.ceil(modsWithCounts.length / PAGE_SIZE)}
      previousLabel="<"
      renderOnZeroPageCount={() => null}
      className={styles.pagination}
      activeClassName={styles["active-page"]}
      hrefBuilder={() => "#"}
    />
  );

  return (
    mods && (
      <>
        <h2 id="nexus-mods">Nexus Mods ({modsWithCounts.length})</h2>
        <div className={styles.filters}>
          <hr />
          <div className={styles["filter-row"]}>
            <label htmlFor="sort-by">Sort by:</label>
            <select
              name="sort-by"
              id="sort-by"
              className={styles["sort-by"]}
              value={sortBy}
              onChange={(event) =>
                dispatch(setSortBy(event.target.value as keyof ModWithCounts))
              }
            >
              <option value="name">Name</option>
              <option value="author_name">Author</option>
              <option value="first_upload_at">Upload Date</option>
              <option value="last_update_at">Last Update</option>
              <option value="total_downloads">Total Downloads</option>
              <option value="unique_downloads">Unique Downloads</option>
              <option value="views">Views</option>
              <option value="exterior_cells_edited">
                Exterior Cells Edited
              </option>
              <option value="nexus_mod_id">ID</option>
            </select>
            <div className={styles["sort-direction"]}>
              <button
                title="Sort ascending"
                onClick={() => dispatch(setSortAsc(true))}
              >
                <img
                  alt="Sort ascending"
                  src={
                    sortAsc
                      ? "/img/arrow-selected.svg"
                      : "/img/arrow-disabled.svg"
                  }
                  className={styles.asc}
                />
              </button>
              <button
                title="Sort descending"
                onClick={() => dispatch(setSortAsc(false))}
              >
                <img
                  alt="Sort descending"
                  src={
                    !sortAsc
                      ? "/img/arrow-selected.svg"
                      : "/img/arrow-disabled.svg"
                  }
                  className={styles.desc}
                />
              </button>
            </div>
          </div>
          <div className={styles["filter-row"]}>
            <label htmlFor="filter">Filter:</label>
            <input
              type="search"
              id="filter"
              className={styles.filter}
              value={filter}
              onChange={(event) => dispatch(setFilter(event.target.value))}
            />
          </div>
          <div className={styles["filter-row"]}>
            <label htmlFor="game">Edition:</label>
            <select
              name="game"
              id="game"
              className={styles["game"]}
              value={game}
              onChange={(event) => dispatch(setGame(event.target.value))}
            >
              <option value="All">All</option>
              {games
                ?.map((game) => game.name)
                .sort()
                .map((game) => (
                  <option key={game} value={game}>
                    {editionNames[game]}
                  </option>
                ))}
            </select>
          </div>
          <div className={styles["filter-row"]}>
            <label htmlFor="category">Category:</label>
            <select
              name="category"
              id="category"
              className={styles["category"]}
              value={category}
              onChange={(event) => dispatch(setCategory(event.target.value))}
            >
              <option value="All">All</option>
              {(
                Array.from(
                  mods
                    .reduce((categories, mod) => {
                      categories.add(mod.category_name);
                      return categories;
                    }, new Set())
                    .values()
                ) as string[]
              )
                .sort()
                .map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
            </select>
          </div>
          <div className={styles["filter-row"]}>
            <label htmlFor="include-translations">Include translations:</label>
            <input
              type="checkbox"
              id="include-translations"
              className={styles["include-translations"]}
              checked={includeTranslations}
              onChange={() =>
                dispatch(setIncludeTranslations(!includeTranslations))
              }
            />
          </div>
          <hr />
        </div>
        {renderPagination()}
        <ul className={styles["mod-list"]}>
          {(!counts.skyrim.counts || !counts.skyrimspecialedition.counts) &&
            renderDownloadCountsLoading()}
          {(!games || gamesError) && renderGamesError(gamesError)}
          {counts.skyrim.error &&
            renderDownloadCountsError(counts.skyrim.error)}
          {counts.skyrimspecialedition.error &&
            renderDownloadCountsError(counts.skyrimspecialedition.error)}
          {modsWithCounts
            .slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
            .map((mod) => (
              <li key={mod.id} className={styles["mod-list-item"]}>
                <div className={styles["mod-title"]}>
                  <strong>
                    <Link
                      href={`/?game=${getGameNameById(mod.game_id)}&mod=${
                        mod.nexus_mod_id
                      }`}
                    >
                      <a>{mod.name}</a>
                    </Link>
                  </strong>
                </div>
                <div>
                  <a
                    href={`${NEXUS_MODS_URL}/${getGameNameById(
                      mod.game_id
                    )}/mods/${mod.nexus_mod_id}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    View on Nexus Mods
                  </a>
                </div>
                <div>
                  <strong>Edition:&nbsp;</strong>
                  {
                    editionNames[
                      getGameNameById(mod.game_id) ?? "skyrimspecialedition"
                    ]
                  }
                </div>
                <div>
                  <strong>Category:&nbsp;</strong>
                  <a
                    href={`${NEXUS_MODS_URL}/${getGameNameById(
                      mod.game_id
                    )}/mods/categories/${mod.category_id}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {mod.category_name}
                  </a>
                </div>
                <div>
                  <strong>Author:&nbsp;</strong>
                  <a
                    href={`${NEXUS_MODS_URL}/${getGameNameById(
                      mod.game_id
                    )}/users/${mod.author_id}`}
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
                {cellCounts && (
                  <div>
                    <strong>Exterior Cells Edited:</strong>{" "}
                    {numberFmt.format(mod.exterior_cells_edited)}
                  </div>
                )}
                <ul className={styles["file-list"]}>
                  {files &&
                    files
                      .filter((file) => file.mod_id === mod.id)
                      .sort((a, b) => b.nexus_file_id - a.nexus_file_id)
                      .map((file) => (
                        <li key={file.id}>
                          <div>
                            <strong>File:</strong> {file.name}
                          </div>
                          {file.mod_version && (
                            <div>
                              <strong>Version:</strong> {file.mod_version}
                            </div>
                          )}
                          {file.version && file.mod_version !== file.version && (
                            <div>
                              <strong>File Version:</strong> {file.version}
                            </div>
                          )}
                          {file.category && (
                            <div>
                              <strong>Category:</strong> {file.category}
                            </div>
                          )}
                          <div>
                            <strong>Size:</strong> {formatBytes(file.size)}
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
        {renderPagination()}
      </>
    )
  );
};

export default ModList;
