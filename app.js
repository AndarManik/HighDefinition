require("dotenv").config();
const express = require("express");
const app = express();
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.API_KEY,
  dangerouslyAllowBrowser: true,
});

const dMap = new Map();
const cMap = new Map();

(async () =>
  dMap.set("High definition", await defineTerm("High definition")))();

app.get("/", async (req, res) => {
  res.redirect("/d/High%20definition");
});

app.get("/d/:word", async (req, res) => {
  const word =
    req.params.word.charAt(0).toUpperCase() +
    req.params.word.slice(1).toLowerCase();
  if (dMap.has(word)) {
    res.send(generatePage(word, dMap.get(word)));
  } else {
    const definition = await defineTerm(word);
    dMap.set(word, definition);
    res.send(generatePage(word, definition));
  }
});

app.get("/c/:definition", async (req, res) => {
  const previousDefinition = req.params.definition;
  if (cMap.has(previousDefinition)) {
    const data = cMap.get(previousDefinition);
    res.send(generatePage(data[0], data[1]));
  } else {
    const word = await getTermFromClick(previousDefinition);
    const definition = await defineTermWithContext(word, previousDefinition);
    cMap.set(previousDefinition, [word, definition]);
    res.send(generatePage(word, definition));
  }
});

async function getTermFromClick(clickDefinition) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Context:
This definition will be used in an interactive dictionary. When a user clicks on a word the website will route the user to the definition of the object clicked not just the word clicked. 

Task:
You will be provided a definition. This definition will have a word inside of square brackets "[]", this word is the clicked word. Based on the clicked word and context clues determine what other words from the definition should be added, if any, to the word to properly determine what object the user wants to define. 

Do no include "Output:" in your output. Only use words which exist in the definition.

Examples as input output pairs:

A [tree] data structure in which each internal node has exactly four children, used primarily in the partitioning of a two-dimensional space by recursively subdividing it into four quadrants or regions.
=>
Tree data structure

A field in mathematics, specifically in abstract [algebra], that contains a finite number of elements, with both addition and multiplication operations, named after the French mathematician Évariste Galois.
=>
Algebra

The action or process of stimulating someone or something, often by encouraging increased activity or enhancing responsiveness through [physical] or chemical intervention.
=>
Physical intervention

Definition: The skillful handling of a difficult or [delicate] situation without arousing hostility, often by employing subtle tactical movements or arguments.
=>
Delicate`,
      },
      {
        role: "user",
        content: clickDefinition,
      },
    ],

  });
  return (
    completion.choices[0].message.content.charAt(0).toUpperCase() +
    completion.choices[0].message.content.slice(1)
  );
}

async function defineTerm(term) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "Provide a formal definition to the term given in the user message. Give only the definition. Do not use the term in the definition. A formal definition consists of 1. The class of object or concept to which the term belongs and 2. The differentiating characteristics that distinguish it from all others of its class.",
      },
      {
        role: "user",
        content: term,
      },
    ],

    });
  return completion.choices[0].message.content.replace(/[\[\]]/g, "");
}

async function defineTermWithContext(term, context) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Context:
The definition you provide will be used in an interactive dictionary website. When a user clicks on a word, the website will route the user to the definition of the term and will automatically display a relevant definition to the context.

Task:
You will be provided with a term and a context which uses said term. What you will provide is a formal definition for this term. If there are many different definitions for a term provide the one which corresponds to the context. Provide up to 100 words. Only output the definition to the term, do not use the term in your definition, and do not mention the usage of the term in your definition. 
A formal definition consists of:
1. The class of object or concept to which the term belongs 
2. The differentiating characteristics that distinguish it from all others of its class.`,
      },
      {
        role: "user",
        content: `Term: "${term}"\nContext: ${context}`,
      },
    ],

  });
  return completion.choices[0].message.content.replace(/[\[\]]/g, "");
}

function generatePage(term, definition) {
  const wordsInTerm = term
    .split(" ")
    .map((word) => {
      return `<a href="/d/${encodeURIComponent(word)}"> ${word} </a>`;
    })
    .join(" ");

  const wordsInDefinition = definition.split(" ");
  const aTags = wordsInDefinition
    .map((word, index) => {
      wordsInDefinition[index] = `[${wordsInDefinition[index]}]`;
      const aTag = `<a href="/c/${encodeURIComponent(
        wordsInDefinition.join(" ")
      )}"> ${word} </a>`;
      wordsInDefinition[index] = word;
      return aTag;
    })
    .join(" ");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
    <title>High Definition</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            background: #fcfcfd;
            font-family: "Inter", sans-serif;
            word-spacing: 0.125rem;
        }
        
        body {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        form {
          border-bottom: 1px solid #101216;
          margin-bottom: 2.5rem;
          margin-top: 1.25rem;
        }

        input {
          padding: 0.25rem;
          padding-left: 0;
          outline: none;
          border: none;
          font-size: 1.25rem;
        }

        input:focus {
          outline: none;
          border: none;
        }
        
        input[type="submit"]:hover {
          text-decoration: underline;
          color: #1d5bea;
        }

        #text {
            max-width: 600px;
            margin-left: 12.5svw;
            margin-right: 12.5svw;            
        }

        #def {
            margin-top: 1.25rem;
            line-height: 1.33;
        }
        
        h1, a {
            color: #101216;
        }

        a {
            font-size: 1.25rem;
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
            color: #1d5bea;
        }

        h1 > a {
            font-size: 2.5rem;
        }

        @media only screen and (max-width: 600px) {
        body {
            word-spacing: 0rem;
            letter-spacing: 0.075rem; /* Adjust as necessary */
        }
}
    </style>
</head>
<body>
    <div id="text">
    <form action="/d/" method="get" onsubmit="if (this.q.value) { location.href = this.action + encodeURIComponent(this.q.value); }  return false;">
        <input type="submit" value="Define:">
        <input type="text" name="q" placeholder="">
    </form>
        <div>
            <h1>${wordsInTerm}</h1> 
        </div>
        <div id="def">
            ${aTags}
        </div>
    </div>
</body>
</html>`;
}

app.listen(process.env.PORT, () => {
  console.log(`Server is running on ${process.env.PORT}`);
});
