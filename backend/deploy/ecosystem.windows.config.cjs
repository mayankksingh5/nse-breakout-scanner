// PM2 process config for running BOTH the live hub and the ngrok tunnel on a
// Windows host. Run it from the backend folder:
//
//   cd C:\Users\mayan\Downloads\nse-breakout-scanner\backend
//   pm2 start deploy\ecosystem.windows.config.cjs
//   pm2 save
//
// Boot persistence (pm2-windows-startup) and keep-awake (powercfg) are separate
// one-time steps — see the Step 3 instructions.
//
// Logs: PM2 keeps per-app logs (view with `pm2 logs`, files under
// %USERPROFILE%\.pm2\logs\). `time: true` timestamps each line.

const ROOT = 'C:/Users/mayan/Downloads/nse-breakout-scanner';

module.exports = {
  apps: [
    {
      name: 'ultra-hub',
      cwd: ROOT + '/backend',
      // Single Node process running the TS entrypoint via tsx's import hook —
      // no npm/child wrapper, so PM2 restarts it cleanly (no orphans).
      script: 'src/live-server.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      autorestart: true,
      max_restarts: 50,
      restart_delay: 5000,
      min_uptime: 10000, // a crash within 10s counts toward max_restarts
      time: true,
    },
    {
      name: 'ultra-ngrok',
      // ngrok is a standalone exe → run directly. It reads the authtoken from
      // %LOCALAPPDATA%\ngrok\ngrok.yml in YOUR user profile.
      script: 'C:/Users/mayan/ngrok/ngrok.exe',
      args: 'http --url=https://padded-deviation-perjury.ngrok-free.dev 8080',
      interpreter: 'none',
      autorestart: true,
      max_restarts: 50,
      restart_delay: 5000,
      min_uptime: 10000,
      time: true,
    },
  ],
};
