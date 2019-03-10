const assert = require('assert');
const rq = require('request-promise-native');
const server = require('../65-hw/get-post-server-task/server');

describe('server test suites', () => {
  let app;

  before(done => {
    app = server.listen(3000, done);
  });

  after(done => {
    app.close(done);
  });

  it('should return index.html', async () => {
    const response = await rq('http://localhost:3000', { resolveWithFullResponse: true });
    assert(response.headers['content-type'], 'text/html');
  })
});
