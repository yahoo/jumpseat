import { watch } from "chokidar";
import { debounce } from "lodash";
import { dirname } from "path";

const regex = /\/node_modules\/|\.node$/;
const entrypoint = process.argv[1];
const folder = dirname(entrypoint);
const watcher = watch(folder, {
  ignoreInitial: true,
  ignored: ["**/*.d.ts", "**/*.tsbuildinfo"]
});

export const invalidate = (
  root: NodeModule,
  cache: Record<string, NodeModule>
) => {
  for (const child of root.children) {
    // Don't invalidate internal .node modules or any node_modules
    if (!regex.test(child.filename)) {
      invalidate(child, cache);
    }
  }

  delete cache[root.filename];
};

watcher.on(
  "change",
  debounce(path => {
    console.log(`JUMPSEAT: change path="${path}"`);

    try {
      const server = require(entrypoint).server;
      server.close(() => {
        invalidate(require.cache[entrypoint], require.cache);
        require(entrypoint);
      });
      server.emit("close");
    } catch (e) {
      console.error("JUMPSEAT: error when restarting the server");
      console.error(e);
    }
  }, 100)
);
