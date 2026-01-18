import { createServer } from "node:http";

createServer((req, res) => {
  let body = '';
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", async () => {
    const parts = JSON.parse(body);
    const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:streamGenerateContent?alt=sse", {
      method: "POST",
      headers: {
        "Content-Type": "text/event-stream",
        "X-goog-api-key": process.env.GEMINI_KEY,
      },
      body: JSON.stringify({
        contents: [
         {
           parts: parts,
         },
       ],
      }),
    });
    // res.statusCode = resp.status;
    // resp.headers.forEach((k, v) => {
    //   res.setHeader(k, v);
    // });
    // res.setHeaders(resp.headers);
    res.writeHead(resp.status, resp.headers);
    for await (const chunk of resp.body) {
      res.write(chunk);
    }
    res.end();
  });
}).listen(8080);
