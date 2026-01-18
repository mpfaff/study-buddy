import TextLineStream from './TextLineStream.mjs';

const ask = document.getElementById("ask");
const askForm = ask.querySelector("& > form");
const askQuery = document.getElementById("ask-query");
const askProgress = document.getElementById("ask-progress");
const askResult = document.getElementById("ask-result");

askProgress.style.display = null;
askProgress.remove();

const JSON_CODE_FENCE_PREFIX = "```json";
const JSON_CODE_FENCE_SUFFIX = "```";

function parseIncrementalJson(answer) {
  if (!answer.startsWith(JSON_CODE_FENCE_PREFIX)) {
    return [];
  }
  answer = answer.substring(JSON_CODE_FENCE_PREFIX.length);
  if (answer.endsWith(JSON_CODE_FENCE_SUFFIX)) {
    answer = answer.substring(0, answer.length - JSON_CODE_FENCE_SUFFIX.length);
  } else {
    answer = answer.trimEnd();
    if (answer.endsWith("}")) {
      answer += ']';
    } else if (answer.endsWith("},")) {
      answer = answer.substring(0, answer.length - 1) + ']';
    }
  }
  console.log(answer, JSON.stringify(answer));
  return JSON.parse(answer);
}

function renderJsonQuestionSet(set, first) {
  for (let i = first; i < set.length; i++) {
    const entry = set[i];

    const el = document.createElement("div");
    el.classList.add("flashcard");

    const question = document.createElement("div");
    question.classList.add("flashcard--question");
    question.innerText = entry.question;

    const answer = document.createElement("div");
    answer.classList.add("flashcard--answer");
    answer.innerText = entry.answer;

    el.appendChild(question);
    el.appendChild(answer);
    askResult.appendChild(el);
  }
}

/**
 * @type {AbortSignal}
 */
let queryAbortController;

askForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  queryAbortController?.abort();
  queryAbortController = new AbortController();
  const abortSignal = queryAbortController.signal;

  ask.insertBefore(askProgress, askResult);

  let answer = '';
  try {
    const answerStream = askAI(abortSignal, [
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
    askResult.replaceChildren();
    let renderedCount = 0;
    for await (const chunk of answerStream) {
      abortSignal.throwIfAborted();
      answer += chunk;
      // askResult.innerText = answer;
      try {
        const parsed = parseIncrementalJson(answer);
        renderJsonQuestionSet(parsed, renderedCount);
        renderedCount = parsed.length;
        delete askResult.dataset.error;
      } catch (e) {
        console.log(e, answer);
      }
    }
    abortSignal.throwIfAborted();
    // if (!answer.startsWith(JSON_CODE_FENCE_PREFIX) || !answer.endsWith(JSON_CODE_FENCE_SUFFIX)) {
    //   throw new Error("Invalid JSON response from model");
    // }
    // const parsed = parseIncrementalJson(answer);
    // renderJsonQuestionSet(parsed);
    delete askResult.dataset.error;
  } catch (e) {
    if (e instanceof AbortError) return;
    askResult.dataset.error = '';
    askResult.innerText = e.toString();
  } finally {
    askProgress.remove();
  }
});

askQuery.addEventListener('input', (e) => {
  if (e.target.value == '') {
    queryAbortController?.abort();
    askResult.replaceChildren();
  }
})

async function* askAI(abortSignal, parts) {
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
   signal: abortSignal,
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
        console.debug(e, value);
      }
    }
  }

  return 'foo';

// ).json()).candidates[0].content.parts[0].text;
}
