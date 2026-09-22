const http = require("http");
const { parse } = require("url");
const next = require("next");

if (typeof PhusionPassenger !== "undefined") {
  PhusionPassenger.configure({ autoInstall: false });
}

const app = next({
  dev: false,
  dir: __dirname,
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });
  if (typeof PhusionPassenger !== "undefined") {
    server.listen("passenger");
  } else {
    server.listen(process.env.PORT || 3000, "0.0.0.0");
  }
});
