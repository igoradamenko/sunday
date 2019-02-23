// Q: Why is it hard to implement ES modules in Node.js?
// A: Because of sync / async problem.

// REVEALING MODULE PATTERN

var myRevealingModule = (function () {
  var privateVar = 'Ben Cherry',
    publicVar = 'Hey there!';

  function privateFunction() {
    console.log('Name:' + privateVar);
  }

  function publicSetName( strName ) {
    privateVar = strName;
  }

  function publicGetName() {
    privateFunction();
  }

  // Reveal public pointers to
  // private functions and properties
  return {
    setName: publicSetName,
    greeting: publicVar,
    getName: publicGetName
  };
})();

myRevealingModule.setName('Paul Kinlan');



// COMMON.JS

// first.js
var second = require('second'); // import module
console.log(second.a);

// second.js
exports = function(){
  return { a: 1 };
};



// NODE.JS impl

// first.js
var second = require('second'); // import module

// second.js
module.exports = function(){
  return { a: 1 };
};


// AMD

// first.js
require(['second'], function(second) {
  console.log(second.a);
});

// second.js
define('second', function() {
  return { a: 1 };
});


// ES Modules

// first.mjs
import second from 'second';
console.log(second.a);

// second.mjs
export default { a: 1 };


