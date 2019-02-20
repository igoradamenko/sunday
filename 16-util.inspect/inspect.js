const util = require('util');

const obj = {
  a: 5,
  b: 6,
  c: {
    a: 5,
    b: 6,
    c: {
      a: 5,
      b: 6,
      c: {
        a: 5,
        b: 6,
        c: {
          a: 5,
          b: 6,
          c: {
            a: 5,
            b: 6,
          },
        },
      },
    },
  },
  inspect: () => 123,
};

obj.self = obj;

console.log(util.inspect(obj, { depth: 10 }));
console.log(obj);
console.dir(obj);
