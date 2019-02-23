function Request() {
  this.bigData = new Array(1e6).join('*');
  this.send = data => console.log(data);
  this.onError = () => this.send('huston, we have a problem');
}

setInterval(function() {
  const request = new Request();
  console.log(process.memoryUsage().heapUsed);
}, 200);
