const promise = new Promise((resolve, reject) => {
  throw new Error('Wrong!');
});

promise.then(
  result => console.log('Result', result),
  error => console.log('Caught', error)
);
