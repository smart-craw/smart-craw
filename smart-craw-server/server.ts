import st from "st";
import http from "http";
export const generateServer = (
  isServerOnly: boolean,
  uiPath: string,
  port: number,
) => {
  if (isServerOnly) {
    return http.createServer().listen(port);
  }
  const mount = st({
    path: uiPath,
    url: "/",
    index: "index.html",
  });
  return http
    .createServer((req, res) => {
      mount(req, res, () => res.end("this is not a static file"));
    })
    .listen(port);
};
