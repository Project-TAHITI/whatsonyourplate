import log from 'loglevel';
import prefix from 'loglevel-plugin-prefix';

const isProd = import.meta.env.PROD;
const isDebug = Boolean(import.meta.env.VITE_DEBUG_MODE || import.meta.env.DEBUG_MODE);

prefix.reg(log);
prefix.apply(log, {
  template: '[%t] %l: ',
  timestampFormatter: (date) => date.toLocaleTimeString(),
  levelFormatter: (level) => level.toUpperCase(),
});

// Set log level: debug if DEBUG_MODE env var is true, else warn in prod, info in dev
if (isDebug) {
  log.setLevel('debug');
} else {
  log.setLevel(isProd ? 'warn' : 'info');
}

export default log;
