const $ = el => document.getElementById(el);
const view = {
  main: $("main"),
  ghost: $("ghost"),
  input: $("input"),
  buttonAdd: $("add"),
  buttonClear: $("clear"),
  output: $("output")
};

const state = {
  tag: "SKILL",
  annotations: new Set(),
  text: ""
};

if (view.input.value) {
  state.text = view.input.value;
  view.ghost.innerHTML = state.text;
  view.main.innerHTML = state.text;
}
view.input.addEventListener("input", evt => {
  state.text = evt.currentTarget.value;
  // clear whenever text changes.
  state.annotations.clear();
  view.ghost.innerHTML = state.text;
  view.main.innerHTML = state.text;
});

function displayAnnotations({ tag, text, annotations }) {
  annotations = Array.from(annotations);
  const sortByStartOffset = (left, right) => left[1] < right[1];
  const sorted = annotations.map(row => row.split(":")).sort(sortByStartOffset);

  while (sorted.length) {
    const [word, start, end] = sorted.shift();
    // Word may consist of pairs/more than two words. Tag them with B-{TAG} for beginning or I-{TAG} for including.
    const tokens = word.split(" ");
    const replacement = tokens
      .map((token, i) =>
        [token, [i === 0 ? "B" : "I", tag].join("-")].join("\t")
      )
      .join(" ");
    console.log(text, replacement);
    text = text.replace(word, replacement);
  }
  return text
    .split(" ")
    .flatMap(token => {
      // Remove trailing commas...
      if (token.includes(tag) && !token.endsWith(tag)) {
        const last = token.slice(-1);
        token = token.substring(0, token.length - 1);
        return [token, last];
      }
      if (token.endsWith(tag)) return token;

      const result = [token, "O"].join("\t");
      if (token.endsWith(".") || token.endsWith("?")) {
        return [result, ""];
      }
      return result;
    })
    .join("\n");
}

view.ghost.addEventListener(
  "click",
  () => {
    const range = window.getSelection().getRangeAt(0);
    const { startOffset, endOffset } = range;
    if (startOffset === endOffset) return;

    const word = state.text.substring(startOffset, endOffset);
    if (!word.trim().length) return;
    console.log(`"${word}" start=${startOffset} end=${endOffset}`);
    if (word.length !== word.trim().length) {
      alert("spaces in the beginning or end of word is not allowed");
      return;
    }

    const result = [word, startOffset, endOffset].join(":");
    state.annotations.has(result)
      ? state.annotations.delete(result)
      : state.annotations.add(result);
    const sorted = Array.from(state.annotations)
      .map(item => item.split(":"))
      .sort((left, right) => left[1] < right[1]);
    let text = state.text;
    for (let [word, ...rest] of sorted) {
      text = text.replace(
        word,
        `<span class='highlight' data-tag="${state.tag}">${word}</span>`
      );
    }
    view.main.innerHTML = text;
  },
  false
);

view.buttonAdd.addEventListener("click", () => {
  const result = displayAnnotations(state);
  view.output.innerHTML = result;

  download("data.iob", result);
  console.log(state);
});

function download(filename, text) {
  var pom = document.createElement("a");
  pom.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  pom.setAttribute("download", filename);

  if (document.createEvent) {
    var event = document.createEvent("MouseEvents");
    event.initEvent("click", true, true);
    pom.dispatchEvent(event);
  } else {
    pom.click();
  }
}

view.buttonClear.addEventListener("click", () => {
  view.output.innerHTML = "";
  view.main.innerHTML = state.text;
  view.ghost.innerHTML = state.text;
  state.annotations.clear();
  console.log(state);
});
