import * as chokidar from "chokidar";
import * as jumpseat from ".";

jest.mock("chokidar", () => ({
  watch: jest.fn().mockReturnValue({ on: jest.fn() }),
}));

class Stub implements NodeModule {
  public children: Stub[];
  public exports: any;
  public filename: string;
  public id: any;
  public loaded: any;
  public parent: any;
  public paths: any;
  public require: any;
  public path: string;

  constructor(filename: string, children: NodeModule[] = []) {
    this.children = children;
    this.filename = filename;
    this.path = "";
  }
}

describe("watcher", () => {
  it("should watch files", () => {
    const watch = chokidar.watch as jest.Mock;
    expect(watch.mock.calls.length).toEqual(1);

    const args = watch.mock.calls[0];
    expect(args).toMatchObject([
      String.prototype,
      {
        ignoreInitial: true,
        ignored: ["**/*.d.ts", "**/*.tsbuildinfo"],
      },
    ]);
  });
});

describe("invalidate", () => {
  const api = new Stub("/app/api/index.js");
  const routes = new Stub("/app/routes.js", [api]);
  const lodash = new Stub("/app/node_modules/lodash.js");
  const native = new Stub("/app/native.node");
  const app = new Stub("/app/app.js", [lodash, native, routes]);
  const index = new Stub("/app/index.js", [app]);

  const cache: Record<string, NodeModule> = {};
  [app, index, lodash, native, routes].forEach((m) => (cache[m.filename] = m));
  jumpseat.invalidate(cache["/app/index.js"], cache);

  it("should invalidate the require cache", () => {
    expect(cache["/app/app.js"]).toBeUndefined();
  });

  it("should recursively invalidate children", () => {
    expect(cache["/app/api/index.js"]).toBeUndefined();
  });

  it("should not invalidate external node_modules", () => {
    expect(cache["/app/node_modules/lodash.js"]).toBeDefined();
  });

  it("should not native modules", () => {
    expect(cache["/app/native.node"]).toBeDefined();
  });
});
