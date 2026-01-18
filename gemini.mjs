import TextLineStream from './TextLineStream.mjs';

const ask = document.getElementById("ask");
const askForm = ask.querySelector("& > form");
const askQuery = document.getElementById("ask-query");
const askProgress = document.getElementById("ask-progress");
const askResult = document.getElementById("ask-result");

askProgress.style.display = null;
askProgress.remove();

askForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  ask.insertBefore(askProgress, askResult);

  let answer = '';
  try {
    const answerStream = askAI([
      {
       // text: `The user wants to learn about a topic. Please begin by summarizing the topic in up to 20 words. Answer the question directly, without any "Here is the answer" text.`,
       text: `The user wants to learn about a topic. Please begin by generating a simple list of questions, one per line, without list formatting. Answer the question directly, without any "Here is the answer" text.`,
      },
      {
       text: "The topic is:",
      },
      {
       text: askQuery.value,
      },
      {
       text: `Here are some sources to help you answer the question, but don't limit yourself to them:
       - https://opendatastructures.org/ods-java.pdf
       `,
       // - https://cshperspectives.cshlp.org/content/8/9/a023218.full.pdf
       // - https://pmc.ncbi.nlm.nih.gov/articles/PMC4433171/
       // - https://www.academia.edu/17237529/Review_Mitosis_in_Transition
       // - https://journals.asm.org/doi/pdf/10.1128/ec.00178-07`,
      },
    ]);
    for await (const chunk of answerStream) {
      answer += chunk;
      askResult.innerText = answer;
    }
  } catch (e) {
    askResult.innerText = e.toString();
  } finally {
    askProgress.remove();
  }
});

async function* askAI(parts) {
  // const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent?alt=sse", {
  const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:streamGenerateContent?alt=sse", {
    method: "POST",
    headers: {
      // "Content-Type": "application/json",
      "Content-Type": "text/event-stream",
      "X-goog-api-key": "AIzaSyD1tkOIDeA87qy8Zf1RcjnnJhOsJnChIpg",
    },
    body: JSON.stringify({
     contents: [
       {
         parts: parts
       }
     ],
     // system_instruction: {
     //   parts: [
     //     {
     //       text: `Answer the question directly, without any "wrapper" text`,
     //     },
     //   ],
     // },
    //  generationConfig: {
    //   responseMimeType: "application/json",
    //   responseJsonSchema: {
    //     type: "object",
    //     required: ["answer"],
    //     properties: {
    //       answer: {
    //         type: "array",
    //         description: "The answer to the question"
    //       },
    //     },
    //   }
    // }
    //  generationConfig: {
    //   responseMimeType: "application/json",
    //   responseJsonSchema: {
    //     type: "object",
    //     required: ["flashcards"],
    //     properties: {
    //       flashcards: {
    //         type: "array",
    //         items: {
    //           type: "object",
    //           required: ["question", "answer", "citations"],
    //           properties: {
    //             question: {
    //               type: "string",
    //               description: "The flashcard question"
    //             },                
    //             answer: {
    //               type: "string",
    //               description: "The flashcard answer"
    //             },
    //             citations: {
    //               type: "array",
    //               items: {
    //                 type: "string",
    //                 description: "The flashcard citation, in the format 'INDEX_OF_SOURCE, page PAGE_NUMBER, line LINE_NUMBER'"
    //               }
    //             }
    //           },
    //         },
    //       },
    //     },
    //   }
    // }
   }),
  });
  const reader = resp.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream())
    .getReader()
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value.startsWith("data: ")) {
      try {
        const content = JSON.parse(value.substring("data: ".length)).candidates[0].content;
        if (!content.parts) continue;
        yield content.parts[0].text;
      } catch (e) {
        console.error(e, value);
      }
    }
  }

  return 'foo';

// ).json()).candidates[0].content.parts[0].text;
}
