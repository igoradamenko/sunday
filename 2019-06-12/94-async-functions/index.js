function foo() {}
async function bar() {}

console.log(typeof foo());
console.log(typeof bar());
console.log(typeof bar().then);
