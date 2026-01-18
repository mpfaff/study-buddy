import { createServer } from "node:http";

createServer((req, res) => {
  let body = '';
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", async () => {
    const query = body;
    const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:streamGenerateContent?alt=sse", {
      method: "POST",
      headers: {
        "Content-Type": "text/event-stream",
        "X-goog-api-key": process.env.GEMINI_KEY,
      },
      body: JSON.stringify({
        contents: [
         {
           parts: [
            {
             // text: `The user wants to learn about a topic. Please begin by summarizing the topic in up to 20 words. Answer the question directly, without any "Here is the answer" text.`,
             // text: `The user wants to learn about a topic. Please begin by generating a simple list of questions, one per line, without list formatting. Answer the question directly, without any "Here is the answer" text.`,
             text: `The user wants to learn about a topic. Please begin by generating a simple list of questions and answers in JSON following this format:
             \`\`\`
             [{"question": QUESTION, "answer": ANSWER}, ...]
             \`\`\`

             Be sure to limit your answers to at most 20 words each.`,
            },
            {
             text: "The topic is:",
            },
            {
             text: query,
            },
            {
             // text: `Here are some sources to help you answer the question. If these sources do not contain the answer, respond with \`"unknown"\`:
             text: `Here are some sources to help you answer the question, but don't limit yourself to them:
             - https://opendatastructures.org/ods-java.pdf
             `,
             // - https://cshperspectives.cshlp.org/content/8/9/a023218.full.pdf
             // - https://pmc.ncbi.nlm.nih.gov/articles/PMC4433171/
             // - https://www.academia.edu/17237529/Review_Mitosis_in_Transition
             // - https://journals.asm.org/doi/pdf/10.1128/ec.00178-07`,
            },
          ],
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
