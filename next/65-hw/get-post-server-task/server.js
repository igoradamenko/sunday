/*
 ЗАДАЧА

 Написать HTTP-сервер для загрузки и получения файлов.

 - Все файлы находятся в директории files.
 - Структура файлов НЕ вложенная.

 - Виды запросов к серверу:
   GET /file.ext
   - выдаёт файл file.ext из директории files;
   - правильный mime-type по содержимому (модуль mime).

   POST /file.ext
   - пишет всё тело запроса в файл files/file.ext и выдаёт ОК;
   - если файл уже есть, то выдаёт ошибку 409;
   - при превышении файлом размера 1MB выдаёт ошибку 413;
   - так как поддиректорий нет, то при наличии / или .. в пути сервер должен выдавать ошибку 400;
   - вместо file может быть любое имя файла.

 - Сервер должен корректно обрабатывать ошибки "файл не найден" и другие (ошибка чтения файла).
 - index.html или curl для тестирования.
*/

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const mime = require('mime');

const filesDir = path.join(__dirname, 'files');

const MB = 1024 * 1024 * 100;

module.exports = http.createServer((req, res) => {
  let pathname;

  try {
    pathname = decodeURIComponent(url.parse(req.url).pathname);
  } catch(e) {
    return answer(e, res, 400);
  }

  const filename = pathname.substr(1);

  switch (req.method) {
    case 'GET':
      if (pathname === '/' || pathname === '/index.html') {
        return sendFile(path.join(__dirname, 'public', 'index.html'), res);
      } else if (pathname === '/favicon.ico') {
        return answer(null, res, 404);
      } else {
        const filepath = getSafeFilepath(filename, res);
        return sendFile(filepath, res);
      }

    case 'POST':
      if (req.headers['content-length'] > MB) {
        return answer(null, res, 413);
      }

      if (!filename) {
        return answer(null, res, 400);
      }

      const filepath = getSafeFilepath(filename, res);
      return saveFile(filepath, req, res);

    default:
      return answer(null, res, 502);
  }
});

function sendFile(filepath, res) {
  const fileStream = fs.createReadStream(filepath);

  fileStream.pipe(res);

  fileStream
    .on('error', err => {
      switch (err.code) {
        case 'ENOENT':
          answer(err, res, 404);
          break;
        case 'ENAMETOOLONG':
          answer(err, res, 414);
          break;
        default:
          answer(err, res, 500);
      }

      fileStream.destroy();
    })
    .on('open', () => {
      res.setHeader('content-type', mime.getType(filepath));
    });

  res.on('close', () => fileStream.destroy());
}

function saveFile(filepath, req, res, { again = false } = {}) {
  const fileStream = fs.createWriteStream(filepath, { flags: 'wx' });

  req.pipe(fileStream);

  let bytesRead = 0;

  req
    .on('data', data => {
      bytesRead += data.length;

      if (bytesRead > MB) {
        answer(null, res, 413);
        req.destroy();
        fileStream.destroy();
        silentlyRemoveFile(filepath);
      }
    })
    .on('close', () => {
      fileStream.destroy();
      silentlyRemoveFile(filepath);
    });

  fileStream
    .on('close', () => answer(null, res, 200)) // not finish!
    .on('error', err => {
      fileStream.destroy();

      switch (err.code) {
        case 'ENOENT':
          if (!again) {
            return createFilesDir(res, () => saveFile(filepath, req, res, { again: true }));
          } else {
            silentlyRemoveFile(filepath);
            answer(err, res, 500);
          }
          break;
        case 'EEXIST':
          answer(err, res, 409);
          break;
        case 'ENAMETOOLONG':
          answer(err, res, 414);
          break;
        default:
          silentlyRemoveFile(filepath);
          answer(err, res, 500);
      }

      req.destroy();
    });
}

function silentlyRemoveFile(filepath) {
  fs.unlink(filepath, () => {});
}

function createFilesDir(res, callback) {
  fs.mkdir(filesDir, err => {
    if (err) {
      answer(err, res, 500);
    } else {
      callback();
    }
  });
}

function getSafeFilepath(filename, res) {
  const filepath = path.join(filesDir, filename);
  if (!filepath.startsWith(filesDir)) {
    return answer(null, res, 400);
  }

  return filepath;
}

function answer(e, res, code = 500) {
  if (e) {
    console.error(e);
  }

  if (code >= 400) {
    // https://stackoverflow.com/questions/18367824/how-to-cancel-http-upload-from-data-events/18370751#18370751
    res.setHeader('connection', 'close');
  }

  res.statusCode = code;
  res.end(http.STATUS_CODES[code]);
}
