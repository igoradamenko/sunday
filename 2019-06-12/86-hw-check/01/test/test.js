const assert = require('assert');
const fse = require('fs-extra');
const path = require('path');
const rq = require('request-promise-native');
const { Readable } = require('stream');

const SERVER_FOLDER = path.join(__dirname, '../../m.donskoy');
const SERVER_URL = 'http://localhost:3000';

const TEXT_FILE_SRC = path.join(__dirname, './fixtures/test.txt');
const TEXT_FILE_DEST = path.join(SERVER_FOLDER, './files/test.txt');
const TEXT_FILE_URL = `${SERVER_URL}/test.txt`;

const server = require(path.join(SERVER_FOLDER, './index.js'));

describe('Server', () => {
  let app;

  before(done => {
    app = server.listen(3000, done);
  });

  beforeEach(() => {
    fse.emptyDirSync(path.join(SERVER_FOLDER, './files'));
  });

  after(done => {
    app.close(done);
  });

  context('GET /', () => {
    it('should return index.html on /', async () => {
      const response = await rq(SERVER_URL, { resolveWithFullResponse: true });
      assert.strictEqual(response.headers['content-type'], 'text/html');
    });

    it('should return index.html on /index.html', async () => {
      const response = await rq(`${SERVER_URL}/index.html`, { resolveWithFullResponse: true });
      assert.strictEqual(response.headers['content-type'], 'text/html');
    });
  });

  context('GET /:file', () => {
    it('should return file when it exists', async () => {
      fse.copySync(TEXT_FILE_SRC, TEXT_FILE_DEST);

      assert.strictEqual(await rq(TEXT_FILE_URL), fse.readFileSync(TEXT_FILE_SRC, { encoding: 'utf-8' }));
    });

    it('should return correct content-type for the file', async () => {
      const srcFile = path.join(__dirname, './fixtures/test.gif');
      const destFile = path.join(SERVER_FOLDER, './files/test.gif');
      fse.copySync(srcFile, destFile);

      const response = await rq(`${SERVER_URL}/test.gif`, { resolveWithFullResponse: true });
      assert.strictEqual(response.headers['content-type'], 'image/gif');
    });

    it('should return 400 when not allowed path requested', async () => {
      await assert.rejects(
        () => rq(`${SERVER_URL}/../public/index.html`),
        { statusCode: 400 },
      );
    });

    it('should return 400 when nested path requested', async () => {
      await assert.rejects(
        () => rq(`${SERVER_URL}/test/test.txt`),
        { statusCode: 400 },
      );
    });

    it('should return 404 when file doesn\'t exist', async () => {
      await assert.rejects(
        () => rq(TEXT_FILE_URL),
        { statusCode: 404 },
      );
    });

    it('should return 500 when file is a dir (or smth else goes wrong while reading)', async () => {
      const dir = path.join(SERVER_FOLDER, './files/test');
      fse.mkdirpSync(dir);

      await assert.rejects(
        () => rq(`${SERVER_URL}/test`),
        { statusCode: 500 },
      );
    });
  });

  context('POST /:file', () => {
    it('should save passed file', async () => {
      await rq.post(TEXT_FILE_URL, {
        body: fse.createReadStream(TEXT_FILE_SRC),
      });

      assert.strictEqual(fse.readFileSync(TEXT_FILE_DEST, { encoding: 'utf-8' }), fse.readFileSync(TEXT_FILE_SRC, { encoding: 'utf-8' }));
    });

    it('should save passed zero-size (!) file', async () => {
      const stream = Readable();

      const req = rq.post(TEXT_FILE_URL, {
        body: stream,
      });
      stream.pipe(req);
      stream.push(null);

      await req;

      assert.strictEqual(fse.statSync(TEXT_FILE_DEST).size, 0);
    });

    it('should save passed file when files folder exists and not empty', async () => {
      const oneMoreFile = path.join(SERVER_FOLDER, './files/oneMore.txt');

      fse.copySync(TEXT_FILE_SRC, oneMoreFile);

      await rq.post(TEXT_FILE_URL, {
        body: fse.createReadStream(TEXT_FILE_SRC),
      });

      assert.strictEqual(fse.readFileSync(TEXT_FILE_DEST, { encoding: 'utf-8' }), fse.readFileSync(TEXT_FILE_SRC, { encoding: 'utf-8' }));
    });

    it('should return 400 when not allowed path passed', async () => {
      await assert.rejects(
        () => rq.post(`${SERVER_URL}/../test.txt`, {
          body: fse.createReadStream(TEXT_FILE_SRC),
        }),
        { statusCode: 400 },
      );
    });

    it('should return 400 when nested path passed', async () => {
      await assert.rejects(
        () => rq.post(`${SERVER_URL}/test/test.txt`, {
          body: fse.createReadStream(TEXT_FILE_SRC),
        }),
        { statusCode: 400 },
      );
    });

    it('should return 409 when passed file already exists', async () => {
      fse.copySync(TEXT_FILE_SRC, TEXT_FILE_DEST);

      const oldMtime = fse.statSync(TEXT_FILE_DEST).mtime;

      await assert.rejects(
        () => rq.post(TEXT_FILE_URL, {
          body: fse.createReadStream(TEXT_FILE_SRC),
        }),
        { statusCode: 409 },
      );

      const newMtime = fse.statSync(TEXT_FILE_DEST).mtime;

      assert.strictEqual(oldMtime.toString(), newMtime.toString());
    });

    it('should return 409 when passed zero-size (!) file already exists', async () => {
      fse.copySync(TEXT_FILE_SRC, TEXT_FILE_DEST);

      const oldMtime = fse.statSync(TEXT_FILE_DEST).mtime;

      await assert.rejects(
        () => {
          const stream = Readable();
          const req = rq.post(TEXT_FILE_URL, {
            body: stream,
          });
          stream.pipe(req);
          stream.push(null);

          return req;
        },
        { statusCode: 409 },
      );

      const newMtime = fse.statSync(TEXT_FILE_DEST).mtime;

      assert.strictEqual(oldMtime.toString(), newMtime.toString());
    });

    it('should return 413 when passed file takes more than 1 mb', async () => {
      const symbolStream = new StringSteam();

      await assert.rejects(
        () => rq.post(TEXT_FILE_URL, {
          body: symbolStream,
        }),
        { statusCode: 413 },
      );

      // because file removing is async action
      await new Promise(resolve => {
        setTimeout(() => {
          assert.throws(
            () => fse.statSync(TEXT_FILE_DEST),
            { code: 'ENOENT' },
          );
          resolve();
        }, 100)
      });
    });

    it('should return 414 when passed file name is too long', async () => {

      await assert.rejects(
        () => rq.post(`${SERVER_URL}/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`),
        { statusCode: 414 },
      );
    });
  });

  context('PUT /:file', () => {
    it('should return 502 on put', async () => {
      await assert.rejects(
        () => rq.put(TEXT_FILE_URL),
        { statusCode: 502 },
      );
    });
  });
});

class StringSteam extends Readable {
  constructor() {
    super();

    this.__maxSize = 1024 * 1024 * 2; // 2 MB
    this.__chunkSize = this._readableState.highWaterMark;
    this.__length = 0;
    this.__finished = false;
  }

  _read(n) {
    if (!this.__finished) {
      process.nextTick(() => {
        this.push('a'.repeat(n || this.__chunkSize));

        this.__length += n || this.__chunkSize;

        if (this.__length >= this.__maxSize) {
          this.push(null);
          this.__finished = true;
        }
      });
    }
  }
}
