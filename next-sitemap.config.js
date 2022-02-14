/** @type {import('next-sitemap').IConfig} */
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const MOD_SEARCH_INDEX_URL = 'https://mods.modmapper.com/mod_search_index.json';

module.exports = {
  siteUrl: process.env.SITE_URL || 'https://modmapper.com',
  generateRobotsTxt: true,
  additionalPaths: async (config) => {
    console.log("additional paths");
    const result = []

    const response = await fetch(MOD_SEARCH_INDEX_URL);
    const index = await response.json();

    for (const mod of index) {
      result.push({
        loc: '/?mod=' + mod.id,
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