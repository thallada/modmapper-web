import React, { createContext, useEffect, useState } from "react";
import useSWRImmutable from "swr/immutable";

import { csvFetcher } from "../lib/api";

type DownloadCounts = Record<number, [number, number, number]>;
interface GameDownloadCounts {
  skyrim: {
    counts: DownloadCounts | null;
    error?: any;
  };
  skyrimspecialedition: {
    counts: DownloadCounts | null;
    error?: any;
  };
}

type DownloadCountsContext = GameDownloadCounts;

const SSE_LIVE_DOWNLOAD_COUNTS_URL =
  "https://staticstats.nexusmods.com/live_download_counts/mods/1704.csv";
const LE_LIVE_DOWNLOAD_COUNTS_URL =
  "https://staticstats.nexusmods.com/live_download_counts/mods/110.csv";

export const DownloadCountsContext = createContext<DownloadCountsContext>({
  skyrim: {
    counts: null,
  },
  skyrimspecialedition: {
    counts: null,
  },
});

function parseCountsCSV(csv: string): DownloadCounts {
  const counts: Record<number, [number, number, number]> = {};
  for (const line of csv.split("\n")) {
    const nums = line.split(",").map((count) => parseInt(count, 10));
    counts[nums[0]] = [nums[1], nums[2], nums[3]];
  }
  return counts;
}

const DownloadCountsProvider: React.FC = ({ children }) => {
  const [skyrimCounts, setSkyrimCounts] = useState<DownloadCounts | null>(null);
  const [skyrimspecialeditionCounts, setSkyrimspecialeditionCounts] =
    useState<DownloadCounts | null>(null);

  // The live download counts are not really immutable, but I'd still rather load them once per session
  const { data: skyrimspecialeditionCSV, error: skyrimspecialeditionError } =
    useSWRImmutable(SSE_LIVE_DOWNLOAD_COUNTS_URL, csvFetcher);
  const { data: skyrimCSV, error: skyrimError } = useSWRImmutable(
    LE_LIVE_DOWNLOAD_COUNTS_URL,
    csvFetcher
  );

  useEffect(() => {
    if (skyrimCSV) {
      setSkyrimCounts(parseCountsCSV(skyrimCSV));
    }
  }, [setSkyrimCounts, skyrimCSV]);

  useEffect(() => {
    if (skyrimspecialeditionCSV) {
      setSkyrimspecialeditionCounts(parseCountsCSV(skyrimspecialeditionCSV));
    }
  }, [setSkyrimspecialeditionCounts, skyrimspecialeditionCSV]);

  return (
    <DownloadCountsContext.Provider
      value={{
        skyrim: {
          counts: skyrimCounts,
          error: skyrimError,
        },
        skyrimspecialedition: {
          counts: skyrimspecialeditionCounts,
          error: skyrimspecialeditionError,
        },
      }}
    >
      {children}
    </DownloadCountsContext.Provider>
  );
};

export default DownloadCountsProvider;
