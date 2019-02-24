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

// Пример простого сервера в качестве основы

const http = require('http');
const url = require('url');
const fs = require('fs');

http.createServer((req, res) => {
  const pathname = decodeURI(url.parse(req.url).pathname);

  switch(req.method) {
    case 'GET':
      if (pathname === '/') {
        // отдачу файлов надо сделать «правильно»
        fs.readFile(`${__dirname}/public/index.html`, (err, content) => {
          if (err) throw err;
          res.setHeader('Content-Type', 'text/html;charset=utf-8');
          res.end(content);
        });
        return;
      }

    default:
      res.statusCode = 502;
      res.end('Not implemented');
  }
}).listen(3000);
