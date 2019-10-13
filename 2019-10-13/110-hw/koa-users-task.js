/*
  REST API-сервис для пользователей на Koa.JS + Mongoose (то есть, без UI)

  User имеет уникальный email, имя — displayName, а также даты создания и модификации.

  GET /users — получить массив юзеров: email, displayName и id (равный _id).

  GET /users/:id — получить юзера по id, например: /users/57ffe7300b863737ddfe9a39.

  POST /users — создать пользователя
    Позволяет указать только email и displayName (нельзя при создании юзера указать его _id).

  PATCH /users/:id — модифицировать пользователя
    Позволяет поменять только email и displayName (нельзя при изменении юзера изменить его _id).

  DELETE /users/:id — удалить пользователя.

  Если юзера с данным :id нет — методы возвращают 404.

  Если ошибка валидации (напр. не указан email) или уникальности:
    метод возвращает 400 и объект с ошибками вида { errors: { field: error } }
    пример:
      {
        errors: {
          email: 'Такой email уже есть'
        }
      }

  Желательно, с тестами.

  Note: https://www.npmjs.com/package/@noname-land/mongoose-beautiful-unique-validation.
*/
