/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Suppress defaultProps warnings from Semantic UI React
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries = await originalEntry();

        if (entries['main.js'] && !isServer) {
          entries['main.js'] = [
            './src/utils/suppress-warnings.js',
            ...entries['main.js']
          ];
        }

        return entries;
      };
    }
    return config;
  }
}

module.exports = nextConfig
