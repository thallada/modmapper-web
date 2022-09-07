import React, { createContext, useEffect, useRef, useState } from "react";
import MiniSearch from "minisearch";
import useSWRImmutable from "swr/immutable";

import { jsonFetcher } from "../lib/api";
import type { GameName } from "../lib/games";

interface Mod {
  name: string;
  id: number;
}

interface ModWithGame {
  name: string;
  id: number;
  game: GameName;
}

let cells = [];

for (let x = -77; x < 76; x++) {
  for (let y = -50; y < 45; y++) {
    const id = `${x},${y}`;
    cells.push({ id, name: `Cell ${id}`, x, y });
  }
}
const cellSearch = new MiniSearch({
  fields: ["id"],
  storeFields: ["id", "name", "x", "y"],
  tokenize: (s) => [s.replace(/(cell\s?)|\s/gi, "")],
  searchOptions: {
    fields: ["id"],
    prefix: true,
    fuzzy: false,
  },
});
cellSearch.addAll(cells);

type SearchContext = {
  cellSearch: MiniSearch;
  modSearch?: MiniSearch;
  loading: boolean;
  loadError?: any;
};

export const SearchContext = createContext<SearchContext>({
  cellSearch,
  loading: true,
});

const SearchProvider: React.FC = ({ children }) => {
  const modSearch = useRef<MiniSearch<ModWithGame>>(
    new MiniSearch({
      fields: ["name"],
      storeFields: ["name", "id", "game"],
      searchOptions: {
        fields: ["name"],
        fuzzy: 0.2,
        prefix: true,
      },
    })
  ) as React.MutableRefObject<MiniSearch<ModWithGame>>;
  const [loading, setLoading] = useState(true);
  const [skyrimLoading, setSkyrimLoading] = useState(true);
  const [skyrimspecialEditionLoading, setSkyrimspecialeditionLoading] =
    useState(true);

  const { data: skyrimData, error: skyrimError } = useSWRImmutable(
    `https://mods.modmapper.com/skyrim/mod_search_index.json`,
    (_) => jsonFetcher<Mod[]>(_, { notFoundOk: false })
  );
  const { data: skyrimspecialeditionData, error: skyrimspecialeditionError } =
    useSWRImmutable(
      `https://mods.modmapper.com/skyrimspecialedition/mod_search_index.json`,
      (_) => jsonFetcher<Mod[]>(_, { notFoundOk: false })
    );

  useEffect(() => {
    if (skyrimData) {
      modSearch.current
        .addAllAsync(skyrimData.map((mod) => ({ ...mod, game: "skyrim" })))
        .then(() => {
          setSkyrimLoading(false);
        });
    }
  }, [skyrimData]);

  useEffect(() => {
    if (skyrimspecialeditionData) {
      modSearch.current
        .addAllAsync(
          skyrimspecialeditionData.map((mod) => ({
            ...mod,
            game: "skyrimspecialedition",
          }))
        )
        .then(() => {
          setSkyrimspecialeditionLoading(false);
        });
    }
  }, [skyrimspecialeditionData]);

  useEffect(() => {
    if (
      (!skyrimLoading || skyrimError) &&
      (!skyrimspecialEditionLoading || skyrimspecialeditionError)
    ) {
      setLoading(false);
    }
  }, [
    skyrimLoading,
    skyrimError,
    skyrimspecialEditionLoading,
    skyrimspecialeditionError,
  ]);

  return (
    <SearchContext.Provider
      value={{
        modSearch: modSearch.current,
        cellSearch,
        loading,
        loadError: skyrimspecialeditionError || skyrimError,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export default SearchProvider;
