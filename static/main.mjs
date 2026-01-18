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

const ABORT_REASON = {}

askForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const query = askQuery.value.trim();
  if (!query) {
    // Shake animation for empty input
    askQuery.style.animation = 'shake 0.5s';
    setTimeout(() => {
        askQuery.style.animation = '';
    }, 500);
    askResult.replaceChildren();
    return;
  }

  queryAbortController?.abort(ABORT_REASON);
  queryAbortController = new AbortController();
  const abortSignal = queryAbortController.signal;

  ask.insertBefore(askProgress, askResult);

  let answer = '';
  try {
    const answerStream = askAI(abortSignal, query);
    askResult.replaceChildren();
    let renderedCount = 0;
    for await (const chunk of answerStream) {
      abortSignal.throwIfAborted();
      answer += chunk;
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
    delete askResult.dataset.error;
  } catch (e) {
    if (e.reason === ABORT_REASON) return;
    askResult.dataset.error = '';
    askResult.innerText = e.toString();
  } finally {
    askProgress.remove();
  }
});

askQuery.addEventListener('input', (e) => {
  if (e.target.value == '') {
    queryAbortController?.abort(ABORT_REASON);
    askResult.replaceChildren();
  }
})

async function* askAI(abortSignal, query) {
  const resp = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "text/event-stream",
    },
    body: JSON.stringify(query),
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
}
