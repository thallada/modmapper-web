/** @type {import('next-sitemap').IConfig} */
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const SSE_MOD_SEARCH_INDEX_URL = 'https://mods.modmapper.com/skyrimspecialedition/mod_search_index.json';
const LE_MOD_SEARCH_INDEX_URL = 'https://mods.modmapper.com/skyrim/mod_search_index.json';

module.exports = {
  siteUrl: process.env.SITE_URL || 'https://modmapper.com',
  generateRobotsTxt: true,
  additionalPaths: async (config) => {
    const result = []

    const skyrimResponse = await fetch(LE_MOD_SEARCH_INDEX_URL);
    const skyrimIndex = await skyrimResponse.json();

    const skyrimspecialeditionResponse = await fetch(SSE_MOD_SEARCH_INDEX_URL);
    const skyrimspecialeditionIndex = await skyrimspecialeditionResponse.json();

    for (const mod of skyrimIndex) {
      result.push({
        loc: `/?game=skyrim&mod=${mod.id}`,
        changefreq: 'daily',
      });
    }
    for (const mod of skyrimspecialeditionIndex) {
      result.push({
        loc: `/?game=skyrimspecialedition&mod=${mod.id}`,
        changefreq: 'daily',
      });
    }

    for (let x = -77; x < 75; x++) {
      for (let y = -50; y < 44; y++) {
        result.push({
          loc: '/?cell=' + encodeURIComponent(`${x},${y}`),
          changefreq: 'daily',
        });
      }
    }

    return result
  },
}