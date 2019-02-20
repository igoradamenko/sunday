const EventEmitter = require('events').EventEmitter;

const db = new EventEmitter();

function Request() {
  this.bigData = new Array(1e6).join('*');
  this.send = data => console.log(data);
  db.on('data', data => this.send(data));
}

setInterval(function() {
  const request = new Request();
  console.log(db);
  console.log(process.memoryUsage().heapUsed);
}, 200);
