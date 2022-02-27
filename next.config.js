/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    const experiments = config.experiments || {};
    config.experiments = {...experiments, asyncWebAssembly: true};
    return config
  },
}

module.exports = nextConfig
