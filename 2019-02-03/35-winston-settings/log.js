const winston = require('winston');

module.exports = module => makeLogger(module.filename);

function makeLogger(path) {
  if (path.match(/request\.js$/)) {
    const transports = [
      new winston.transports.Console({
        timestamp: true,
        colorize: true,
        level: 'info',
      }),

      new winston.transports.File({
        filename: 'debug.log',
        level: 'debug',
      }),
    ];

    return new winston.Logger({ transports });
  } else {
    return new winston.Logger({ transports: [] });
  }
}
