# jumpseat [![Build Status](https://travis-ci.com/yahoo/jumpseat.svg?branch=master)](https://travis-ci.com/yahoo/jumpseat) [![npm](https://badge.fury.io/js/jumpseat.png)](https://npmjs.org/package/jumpseat)

Hot restart a node server, automatically.

Jumpseat is a companion to node servers, either [express](https://expressjs.com/) or [vanilla](https://nodejs.org/api/http.html#http_http_createserver_options_requestlistener) which will invalidate your require cache and reload the server **without killing the node process**.

This means that any debugger sessions are left in tact, making development faster, and easier.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [Maintainers](#maintainers)
- [License](#license)

## Background

[Node.js](https://nodejs.org/) will cache required modules meaning that a restart is generally required to load new changes.  Tools such as [Nodemon](https://nodemon.io/) make this easier by restarting your node process each time a change is made to a source file.

Jumpseat takes a more nuanced approach.  Instead of restarting the node process, killing any existing debugger sessions, the require cache is cleared and the http server is restarted.  This decreases the time for iterative development since the server is listening again more quickly and there is no need to re-attach debuggers.

When you launch `node -r jumpseat index.js` we create a watch on index.js and the other files in its folder.  If any of those files are modified, node's require cache is purged ( ignoring `node_modules` ) and the server is then restarted.

## Install

`npm install jumpseat --save-development`

## Usage

Simply [preload](https://nodejs.org/api/cli.html#cli_r_require_module) the `jumpseat` module when running your server.

```bash
node -r jumpseat index.js
```

Your server **must** be exported as a named export ( since es modules and commonjs differ on default export, but agree on named exports ) with the name `server`.

```js
// index.js
const express = require('express');
const app = express();
app.use('/', (req, res) => {
    res.sendStatus(200)
});
const server = app.listen(8080);

// Export your server as a named export so we can restart it
module.exports.server = server;
```

## Contribute

Please refer to [the CONTRIBUTING file](CONTRIBUTING.md) for information about how to get involved. We welcome issues, questions, and pull requests. Pull Requests are welcome.

## Maintainers
Suneil Nyamathi: suneil.nyamathi@verizonmedia.com

## License

This project is licensed under the terms of the [MIT](LICENSE) open source license. Please refer to [LICENSE](LICENSE) for the full terms.
