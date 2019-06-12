const promise = new Promise((resolve, reject) => {
  setTimeout(() => resolve('OK'), 1000);
  setTimeout(() => reject('Wrong!'), 2000);
});

promise.then(
  result => console.log('Result', result),
  error => console.log('Caught', error)
);
