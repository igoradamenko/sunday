# 01. Node.js

[Node.js sources](nodejs.org).

Node.js was created by [Ryan Dahl](https://github.com/ry) in 2009.

> Dahl (1980 or 1981) grew up in San Diego, California. His mother got an Apple IIc when he was six years old, one of his first experiences with technology.
> 
> Once he realized that he did not want to be a mathematician for the rest of his life, he dropped out of the PhD program and bought a one-way ticket to South America and lived there for a year, where he found a job as a web developer. He worked on a Ruby on Rails website for a snowboard company

Despite the fact that he created Node.js, now he prefers Go for creating backend apps rather Node.js.

Also Ryan created [deno](https://github.com/denoland/deno). 

Node.js is based on [V8](https://en.wikipedia.org/wiki/Chrome_V8), an open-source JS engine.

> The first JS engine was created by Brendan Eich in 1995 for the Netscape Navigator web browser. It was a rudimentary interpreter for the nascent language Eich invented. (This evolved into the SpiderMonkey engine, still used by the Firefox browser.)

> V8 compiles JavaScript directly to native machine code before executing it, instead of more traditional techniques such as interpreting bytecode or compiling the whole program to machine code and executing it from a filesystem. The compiled code is additionally optimized (and re-optimized) dynamically at runtime, based on heuristics of the code's execution profile. Optimization techniques used include inlining, elision of expensive runtime properties, and inline caching. The garbage collector is a generational incremental collector.  

So, JS is dynamic language, but V8 implements a lot of features that usually works on static OOP languages, which makes V8 so popular and powerful.

[Bytecode](https://en.wikipedia.org/wiki/Bytecode).

[Machine code](https://en.wikipedia.org/wiki/Machine_code).

[Comparison of JavaScript engines](https://en.wikipedia.org/wiki/Comparison_of_JavaScript_engines).

V8 is just one of the three components of Node.js. Another two are: I/O and modules.

Why Node.js:

1. JS.
2. Shared code on frontend and backend.
3. Created for web (versus Java, C#, etc).
4. Can handle a lot of connections and tasks simultaneously.
5. Easy to start, easy to crete a prototype of future app.
6. npm.
7. Community.

Modules are described in docs and have a [stability index](https://nodejs.org/docs/latest/api/documentation.html#documentation_stability_index).
