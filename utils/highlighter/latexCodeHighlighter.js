const fs = require("fs");
const path = require("path");
const vsctm = require("vscode-textmate");
const oniguruma = require("vscode-oniguruma");

// https://github.com/microsoft/vscode-textmate

/**
 * Utility to read a file as a promise
 */
function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (error, data) => (error ? reject(error) : resolve(data)));
  });
}

const wasmBin = fs.readFileSync(
  path.join(__dirname, "./node_modules/vscode-oniguruma/release/onig.wasm")
).buffer;

const vscodeOnigurumaLib = oniguruma.loadWASM(wasmBin).then(() => {
  return {
    createOnigScanner(patterns) {
      return new oniguruma.OnigScanner(patterns);
    },
    createOnigString(s) {
      return new oniguruma.OnigString(s);
    },
  };
});

// Create a registry that can create a grammar from a scope name.
const registry = new vsctm.Registry({
  onigLib: vscodeOnigurumaLib,
  loadGrammar: (scopeName) => {
    if (scopeName === "source.js") {
      // https://github.com/textmate/javascript.tmbundle/blob/master/Syntaxes/JavaScript.plist
      return readFile(
        "./JavaScript.plist"
      ).then((data) => vsctm.parseRawGrammar(data.toString()));
    }
    console.log(`Unknown scope name: ${scopeName}`);
    return null;
  },
});

function formatScopeTocTex(scope, string) {
  if (scope.includes("entity.name.function.js"))
    return `<@\\textcolor{RoyalBlue}{${string}}@>`;

  if (scope.includes("variable.parameter.function.js"))
    return `<@\\textcolor{Blue}{${string}}@>`;

  if (scope.includes("entity.name.function.js"))
    return `<@\\textcolor{Apricot}{${string}}@>`;

  if (scope.includes("variable.parameter.function.js"))
    return `<@\\textcolor{Blue}{${string}}@>`;

  if (scope.includes("keyword.operator.assignment.js"))
    return `<@\\textcolor{Red}{${string}}@>`;

  if (
    scope.includes("punctuation.definition.function-call.begin.js") ||
    scope.includes("punctuation.definition.function-call.end.js")
  )
    return `<@\\textcolor{Green}{${string}}@>`;

  if (scope.includes("punctuation.section.scope.begin.js")) {
    if (string === "{") return `<@\\textcolor{Bittersweet}{\\{}@>`;
    else {
      return `<@\\textcolor{Bittersweet}{${string}}@>`;
    }
  }

  if (scope.includes("punctuation.section.scope.end.js"))
    if (string === "}") return `<@\\textcolor{Bittersweet}{\\}}@>`;
    else {
      return `<@\\textcolor{Bittersweet}{${string}}@>`;
    }
  if (
    scope.includes("punctuation.definition.parameters.begin.js") ||
    scope.includes("punctuation.definition.parameters.end.js")
  )
    return `<@\\textcolor{Dandelion}{${string}}@>`;

  if (
    scope.includes("punctuation.definition.string.begin.js") ||
    scope.includes("punctuation.definition.string.end.js")
  )
    return `<@\\textcolor{Black}{''}@>`;

  if (scope.includes("storage.type.var.js"))
    return `<@\\textcolor{Aquamarine}{${string}}@>`;

  if (scope.includes("keyword.control.js"))
    return `<@\\textcolor{Purple}{${string}}@>`;

  if (scope.includes("support.constant.dom.js"))
    return `<@\\textcolor{ProcessBlue}{${string}}@>`;

  if (scope.includes("meta.function-call.js"))
    return `<@\\textcolor{WildStrawberry}{${string}}@>`;

  if (scope.includes("storage.type.function.js"))
    return `<@\\textcolor{BlueViolet}{${string}}@>`;

  if (scope.includes("string.quoted.double.js"))
    return `<@\\textcolor{Sepia}{${string}}@>`;

  if (scope.includes("keyword.operator.arithmetic.js"))
    return `<@\\textcolor{Tan}{${string}}@>`;

  if (scope.includes("keyword.other.documentation.js.jsdoc"))
    return `<@\\textcolor{Tan}{ ${string}}@>`;

  if (
    scope.includes("comment.line.double-slash.js") ||
    scope.includes("comment.block.documentation.js")
  )
    return `<@\\textcolor{Gray}{${string
      .replace("{", "\\{")
      .replace("}", "\\}")}}@>`;

  /* if (scope.includes("keyword.operator.logical.js"))
    return `<@\\textcolor{Emerald}{ ${string}}@>`; */

  if (scope.includes("constant.numeric.js"))
    return `<@\\textcolor{PineGreen}{ ${string}}@>`;

  return string;
}

// Load the JavaScript grammar and any other grammars included by it async.
registry.loadGrammar("source.js").then(async (grammar) => {
  const text = fs
    .readFileSync(
      "./array.js"
    )
    .toString()
    .split("\n");
  let texText = [];
  let ruleStack = vsctm.INITIAL;
  for (let i = 0; i < text.length; i++) {
    const line = text[i];
    let texLine = "";
    const lineTokens = grammar.tokenizeLine(line, ruleStack);
    console.log(`\nTokenizing line: ${line}`);
    for (let j = 0; j < lineTokens.tokens.length; j++) {
      const token = lineTokens.tokens[j];
      console.log(
        ` - token from ${token.startIndex} to ${token.endIndex} ` +
          `(${line.substring(token.startIndex, token.endIndex)}) ` +
          `with scopes ${token.scopes.join(", ")}`
      );
      texLine =
        texLine +
        formatScopeTocTex(
          token.scopes.join(", "),
          line.substring(token.startIndex, token.endIndex)
        );
    }
    texText.push(texLine); //?
    ruleStack = lineTokens.ruleStack;
  }
  var file = fs.createWriteStream("mapPreviewDoc.js.txt");
  file.on("error", function (err) {
    console.log(
      "𓀒 ~ file: latexCodeHighlighter.js ~ line 165 ~ err on createWriteStream",
      err
    );
  });
  texText.forEach(function (v) {
    file.write(v + "\n");
  });
  file.end();
});
