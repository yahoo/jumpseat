import { watch } from "chokidar";
import { Server, Socket } from "net";
import { dirname } from "path";

interface Dict<T> {
  [key: string]: T | undefined;
}

const regex = /\/node_modules\/|\.node$/;
const entrypoint = process.argv[1];
const folder = dirname(entrypoint);
const watcher = watch(folder, {
  ignoreInitial: true,
  ignored: ["**/*.d.ts", "**/*.tsbuildinfo"],
});

export const invalidate = (root: NodeModule, cache: Dict<NodeModule>) => {
  for (const child of root.children) {
    // Don't invalidate internal .node modules or any node_modules
    if (!regex.test(child.filename)) {
      invalidate(child, cache);
    }
  }

  delete cache[root.filename];
};

// Forcefully stop the server when calling close, destroying all sockets
const manage = (server: Server) => {
  const sockets: Socket[] = [];
  const close = server.close.bind(server);
  server.on("connection", (socket) => sockets.push(socket));
  server.close = (cb) => {
    close(cb);
    sockets.forEach((socket) => socket.destroy());
    return server;
  };
};

// Trailing-edge debounce, called with the args of the last invocation
const debounce = <A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
) => {
  let timer: NodeJS.Timeout | undefined;
  return (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

watcher.on(
  "change",
  debounce((path: string) => {
    console.log(`JUMPSEAT: change path="${path}"`);

    try {
      const server = require(entrypoint).server;
      server.close(() => {
        const root = require.cache[entrypoint];
        if (root) {
          invalidate(root, require.cache);
        }
        manage(require(entrypoint).server);
      });
    } catch (e) {
      console.error("JUMPSEAT: error when restarting the server");
      console.error(e);
    }
  }, 100)
);

watcher.on("ready", () => {
  manage(require(entrypoint).server);
});
