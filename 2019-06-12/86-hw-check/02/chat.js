// в коде есть минимум 7 серьёзных ошибок.
// что это за ошибки?

// открывать в разных браузерах!

const http = require('http');
const fs = require('fs');

let clients = [];

http.createServer((req, res) => {
  switch (req.method + ' ' + req.url) {
    case 'GET /':
      // 1: нет обработки ошибок при чтении (нет файла, нет доступа и пр.)
      // 2: нет обработки ошибок при записи (например, обрыв соединения)
      // замечание: неплохо бы отправлять корректные заголовки (content-type) и пр.
      fs.createReadStream(`${__dirname}/index.html`).pipe(res);
      break;

    case 'GET /subscribe':
      console.log('subscribe');
      // 3: снова нет обработки обрыва, клиенты могут зависнуть тут навечно и съесть память
      clients.push(res);
      break;

    case 'POST /publish':
      let body = '';

      // замечание: неплохо бы обрабатывать и логировать обрывы и пр., но тут не принципиально
      req
        .on('data', data => {
          // 4: нет проверки на предотвращение какого-либо переполнения
          // 5: неявная кодировка (вдруг кто-то послал картинку, а мы приводим сразу к строке?)
          body += data;
        })
        .on('end', () => {
          // 6: нет try-catch
          body = JSON.parse(body);

          console.log(`publish ${body.message}`);
          // замечание: отключить браузерное кэширование
          clients.forEach(res => {
            // 7: toString, т. е. json parse может вернуть число, например
            res.end(body.message);
          });

          clients = [];

          res.end('ok');
        });

      break;

    default:
      res.statusCode = 404;
      res.end('Not found');
  }


}).listen(3000);
