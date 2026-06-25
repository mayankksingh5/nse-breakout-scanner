// pm2 alternative to the systemd unit. Auto-restart on crash; survive reboots
// via `pm2 startup` + `pm2 save`.
//
//   cd /opt/ultra-scanner/backend
//   pm2 start deploy/ecosystem.config.cjs
//   pm2 startup   # run the command it prints (sets up the boot service)
//   pm2 save
//   pm2 logs ultra-live
//
// The app loads backend/.env itself via dotenv.
module.exports = {
  apps: [
    {
      name: 'ultra-live',
      cwd: '/opt/ultra-scanner/backend',
      script: 'npm',
      args: 'run live',
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
      env: { NODE_ENV: 'production' },
    },
  ],
};
