import log from 'loglevel';
import prefix from 'loglevel-plugin-prefix';

const isProd = import.meta.env.PROD;

prefix.reg(log);
prefix.apply(log, {
  template: '[%t] %l: ',
  timestampFormatter: (date) => date.toLocaleTimeString(),
  levelFormatter: (level) => level.toUpperCase(),
});

// Set default log level
const DEFAULT_LEVEL = isProd ? 'warn' : 'info';
log.setLevel(DEFAULT_LEVEL);

export default log;
