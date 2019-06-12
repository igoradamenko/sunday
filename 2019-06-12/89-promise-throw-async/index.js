const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    throw new Error('Wrong!');
  }, 1);
});

promise.then(
  result => console.log('Result', result),
  error => console.log('Caught', error)
);
