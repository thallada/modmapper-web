import React, { createContext, useCallback } from "react";
import useSWRImmutable from "swr/immutable";

import { jsonFetcher } from "../lib/api";

interface Game {
  id: number;
  name: GameName;
  nexus_game_id: number;
}

export type GameName = "skyrim" | "skyrimspecialedition";

interface GamesContext {
  games?: Game[] | null;
  getGameNameById: (id: number) => GameName | undefined;
  error?: any;
}

export const GamesContext = createContext<GamesContext>({
  games: null,
  getGameNameById: () => undefined,
});

const GamesProvider: React.FC = ({ children }) => {
  const { data, error } = useSWRImmutable(
    "https://mods.modmapper.com/games.json",
    (_) => jsonFetcher<Game[]>(_, { notFoundOk: false })
  );

  const getGameNameById = useCallback(
    (id: number): GameName | undefined => {
      if (data) {
        return data.find((game) => (game.id = id))?.name;
      }
    },
    [data]
  );

  return (
    <GamesContext.Provider
      value={{
        games: data,
        getGameNameById,
        error,
      }}
    >
      {children}
    </GamesContext.Provider>
  );
};

export default GamesProvider;
