# modmapper-web

This is the frontend code for the modmapper project. Modmapper is an interactive map of Skyrim mods.

[View the site live at modmapper.com](https://modmapper.com).

![Screenshot of the website](/public/img/full-screenshot.jpg)

This project renders every cell edit from all Skyrim SE mods on nexusmods.com as a heatmap on top of a map of Skyrim.

You can click on a cell to see all of the mods that edit that cell sorted by popularity. Clicking on a mod in that list will show you all of the cells that the mod edits (across all files and versions of the mod). You can also search for a mod by name or a cell by x and y coordinates in the search bar at the top.

You can also upload the plugins from your Skyrim Data folder and the load order from your `plugins.txt` to view all of the edited cells in your current load order. Red cells indicate multiple mods editing the same cell. Clicking on a plugin in your load order will show the cells that the plugin edits and the mods and files it belongs to on nexusmods.com (if it can be found on there).

If you like the Modmapper project and found it useful, [please consider donating me a dollar or two on my NexusMods profile](https://www.nexusmods.com/users/512579) if you can spare it to cover the hosting costs of running the site.

## Related Repositories

- [modmapper](https://github.com/thallada/modmapper): program to automate downloading, extracting, and parsing plugins
- [skyrim-cell-dump](https://github.com/thallada/skyrim-cell-dump): library for parsing skyrim plugin files and extracting CELL data
- [skyrim-cell-dump-wasm](https://github.com/thallada/skyrim-cell-dump-wasm): exports skyrim-cell-dump's functions for WebAssembly

## Getting Started

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

First, install the dependencies:

```
npm install
```

Then create a file named `.env` at the root of the project with the contents:

```
NEXT_PUBLIC_MAPBOX_TOKEN=tokengoeshere
```

You can get a Mapbox token by [creating a mapbox account and generating a token on the access token page](https://docs.mapbox.com/help/glossary/access-token/).

Now, run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the site.

This site is deployed as a static website (with `next build && next export`), so be aware that [SSR and other Node.js features are not supported](https://nextjs.org/docs/advanced-features/static-html-export).
