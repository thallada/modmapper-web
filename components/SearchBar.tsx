import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import type mapboxgl from "mapbox-gl";
import MiniSearch, { SearchResult } from "minisearch";
import useSWRImmutable from "swr/immutable";

import styles from "../styles/SearchBar.module.css";
import { join } from "path/posix";
import { countReset } from "console";

type Props = {
  clearSelectedCell: () => void;
  map: React.MutableRefObject<mapboxgl.Map>;
  counts: Record<number, [number, number, number]> | null;
};

interface Mod {
  name: string;
  id: number;
}

const jsonFetcher = async (url: string): Promise<Mod | null> => {
  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }
  return res.json();
};

const SearchBar: React.FC<Props> = ({ clearSelectedCell, counts, map }) => {
  const router = useRouter();

  const searchEngine = useRef<MiniSearch<Mod> | null>(
    null
  ) as React.MutableRefObject<MiniSearch<Mod>>;

  const { data, error } = useSWRImmutable(
    `https://mods.modmapper.com/mod_search_index.json`,
    jsonFetcher
  );

  useEffect(() => {
    if (data && !searchEngine.current) {
      searchEngine.current = new MiniSearch({
        fields: ["name"],
        storeFields: ["name", "id"],
        searchOptions: {
          fields: ["name"],
          fuzzy: 0.2,
        },
      });
      searchEngine.current.addAll(data as unknown as Mod[]);
    }
  }, [data]);

  const searchInput = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState<string>("");
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [clickingResult, setClickingResult] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (searchInput.current) {
      if (
        searchFocused &&
        global.document.activeElement !== searchInput.current
      ) {
        searchInput.current.focus();
      } else if (
        !searchFocused &&
        global.document.activeElement === searchInput.current
      ) {
        searchInput.current.blur();
      }
    }
  }, [searchFocused]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (searchEngine.current) {
      const results: SearchResult[] = searchEngine.current.search(
        e.target.value
      );
      setResults(results);
    }
  };

  const onChooseResult =
    (item: Mod) =>
    (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
      router.push({ query: { mod: item.id } });
      setSearch("");
      setResults([]);
      setClickingResult(false);
      setSearchFocused(false);
    };

  return (
    <div
      className={`${styles["search-bar"]} ${
        searchFocused ? styles["search-bar-focused"] : ""
      }`}
    >
      <input
        type="text"
        placeholder="Search mods or cells…"
        onChange={onChange}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => {
          if (!clickingResult) {
            setSearch("");
            setResults([]);
            setSearchFocused(false);
          }
        }}
        value={search}
        ref={searchInput}
        disabled={!data}
      />
      {results.length > 0 && (
        <ul className={styles["search-results"]}>
          {results
            .sort((resultA, resultB) => {
              if (counts) {
                const countA = counts[resultA.id];
                const countB = counts[resultB.id];
                if (countA && countB) return countB[2] - countA[2];
              }
              return 0;
            })
            .map((result) => (
              <li
                key={result.id}
                onClick={onChooseResult({ id: result.id, name: result.name })}
                onTouchStart={() => setClickingResult(true)}
                onMouseDown={() => setClickingResult(true)}
              >
                {result.name}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
