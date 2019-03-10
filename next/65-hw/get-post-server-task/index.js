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

const server = require('./server.js');

server.listen(3000);
