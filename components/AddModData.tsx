import { format } from "date-fns";
import React from "react";
import useSWRImmutable from "swr/immutable";

import { Mod, NEXUS_MODS_URL } from "./ModData";
import styles from "../styles/AddModData.module.css";
import { jsonFetcher } from "../lib/api";

type Props = {
  selectedMod: number;
  counts: Record<number, [number, number, number]> | null;
};

const AddModData: React.FC<Props> = ({ selectedMod, counts }) => {
  const { data, error } = useSWRImmutable(
    `https://mods.modmapper.com/${selectedMod}.json`,
    (_) => jsonFetcher<Mod>(_)
  );

  if (error && error.status === 404) {
    return <div>Mod could not be found.</div>;
  } else if (error) {
    return <div>{`Error loading mod data: ${error.message}`}</div>;
  }
  if (data === undefined)
    return <div className={styles.status}>Loading...</div>;
  if (data === null)
    return <div className={styles.status}>Mod could not be found.</div>;

  let numberFmt = new Intl.NumberFormat("en-US");
  const modCounts = counts && counts[data.nexus_mod_id];
  const total_downloads = modCounts ? modCounts[0] : 0;
  const unique_downloads = modCounts ? modCounts[1] : 0;
  const views = modCounts ? modCounts[2] : 0;

  if (selectedMod && data) {
    return (
      <div className={styles.wrapper}>
        <h3>
          <a
            href={`${NEXUS_MODS_URL}/mods/${data.nexus_mod_id}`}
            target="_blank"
            rel="noreferrer noopener"
            className={styles.name}
          >
            {data.name}
          </a>
        </h3>
        <div>
          <strong>Category:&nbsp;</strong>
          <a
            href={`${NEXUS_MODS_URL}/mods/categories/${data.category_id}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            {data.category_name}
          </a>
          {data.is_translation && <strong>&nbsp;(translation)</strong>}
        </div>
        <div>
          <strong>Author:&nbsp;</strong>
          <a
            href={`${NEXUS_MODS_URL}/users/${data.author_id}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            {data.author_name}
          </a>
        </div>
        <div>
          <strong>Uploaded:</strong>{" "}
          {format(new Date(data.first_upload_at), "d MMM y")}
        </div>
        <div>
          <strong>Last Update:</strong>{" "}
          {format(new Date(data.last_update_at), "d MMM y")}
        </div>
        <div>
          <strong>Total Downloads:</strong> {numberFmt.format(total_downloads)}
        </div>
        <div>
          <strong>Unique Downloads:</strong>{" "}
          {numberFmt.format(unique_downloads)}
        </div>
      </div>
    );
  }
  return null;
};

export default AddModData;
