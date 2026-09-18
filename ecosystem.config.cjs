module.exports = {
  apps: [
    {
      name: 'moy-agent',
      script: 'index.mjs',
      autorestart: true,
      max_memory_restart: '200M',
      watch: false,
    },
  ],
};
