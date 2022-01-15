import type { NextPage } from "next";
import Head from "next/head";
import "mapbox-gl/dist/mapbox-gl.css";

import Map from "../components/Map";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Modmapper</title>
        <meta name="description" content="Map of Skyrim mods" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Map />
    </>
  );
};

export default Home;
