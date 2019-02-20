# Require and caching

[Modules docs](https://nodejs.org/docs/latest/api/modules.html) picks:

> The module system is implemented in the require('module') module.

> When a file is run directly from Node.js, require.main is set to its module. That means that it is possible to determine whether a file has been run directly by testing require.main === module.

> Because module provides a filename property (normally equivalent to __filename), the entry point of the current application can be obtained by checking require.main.filename.

> [All Together...](https://nodejs.org/docs/latest/api/modules.html#modules_all_together)

> Modules are cached based on their resolved filename. Since modules may resolve to a different filename based on the location of the calling module (loading from node_modules folders), it is not a guarantee that require('foo') will always return the exact same object, if it would resolve to different files.

> Additionally, on case-insensitive file systems or operating systems, different resolved filenames can point to the same file, but the cache will still treat them as different modules and will reload the file multiple times. For example, require('./foo') and require('./FOO') return two different objects, irrespective of whether or not ./foo and ./FOO are the same file.

> For example, if the file at '/home/ry/projects/foo.js' called require('bar.js'), then Node.js would look in the following locations, [in this order: ...](https://nodejs.org/docs/latest/api/modules.html#modules_loading_from_node_modules_folders)

> It is possible to require specific files or sub modules distributed with a module by including a path suffix after the module name. For instance require('example-module/path/to/file') would resolve path/to/file relative to where example-module is located. The suffixed path follows the same module resolution semantics.

> [Loading from the global folders](https://nodejs.org/docs/latest/api/modules.html#modules_loading_from_the_global_folders).

> [The module wrapper](https://nodejs.org/docs/latest/api/modules.html#modules_the_module_wrapper).
