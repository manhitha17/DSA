"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import questions from "./questions";
import "./globals.css";

// Dynamically import CodeMirror to avoid SSR issues
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

// CodeMirror language packs
import { javascript } from "@codemirror/lang-javascript";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";

const LANGS = {
  python: { id: 71, label: "Python 3", ext: python() },
  c:      { id: 50, label: "C (GCC)", ext: cpp() },     // cpp() handles C syntax OK
  cpp:    { id: 54, label: "C++ (GCC)", ext: cpp() },
  java:   { id: 62, label: "Java", ext: java() },
  js:     { id: 63, label: "JavaScript (Node)", ext: javascript() },
};

export default function Page() {
  const [question, setQuestion] = useState(null);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [stdout, setStdout] = useState("");
  const [verdict, setVerdict] = useState("");

  const extensions = useMemo(() => [LANGS[language].ext], [language]);

  const pickRandom = () => {
    const idx = Math.floor(Math.random() * questions.length);
    const q = questions[idx];
    setQuestion(q);
    setStdout("");
    setVerdict("");
    setStdin(q.input ?? "");
    setCode(getStarter(language, q));
  };

  useEffect(() => {
    pickRandom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Regenerate starter code when language changes
  useEffect(() => {
    if (question) setCode(getStarter(language, question));
  }, [language]); // eslint-disable-line

  const run = async () => {
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: code,
          language_id: LANGS[language].id,
          stdin,
        }),
      });
      const data = await res.json();

      const out =
        (data.stdout && data.stdout.trim()) ||
        (data.compile_output && data.compile_output.trim()) ||
        (data.stderr && data.stderr.trim()) ||
        "";
      setStdout(out);

      const expected = (question?.output ?? "").trim();
      if (out === expected) setVerdict("✅ Correct Output!");
      else setVerdict("❌ Incorrect Output.");
    } catch (e) {
      setStdout("Error: " + e.message);
      setVerdict("");
    }
  };

  return (
    <div className="container">
      <h1 className="heading">💻 DSA Questions</h1>

      <div className="controls">
        <label>Language: </label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="python">Python</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="js">JavaScript</option>
        </select>

        <button className="btn" onClick={pickRandom}>Next Question</button>
      </div>

      {question && (
        <div className="questionBox">
          <h2>{question.title}</h2>
          <p>{question.description}</p>
          <div className="io">
            <div>
              <strong>Sample Input</strong>
              <pre>{question.input}</pre>
            </div>
            <div>
              <strong>Expected Output</strong>
              <pre>{question.output}</pre>
            </div>
          </div>
        </div>
      )}

      <div className="editorWrap">
        <CodeMirror
          value={code}
          height="320px"
          extensions={extensions}
          onChange={(val) => setCode(val)}
        />
      </div>

      <textarea
        className="stdin"
        rows={4}
        value={stdin}
        onChange={(e) => setStdin(e.target.value)}
        placeholder="Custom input (stdin)"
      />

      <div className="actions">
        <button className="btn run" onClick={run}>Run</button>
      </div>

      <div className="output">
        <h3>Output</h3>
        <pre>{stdout}</pre>
        <p className="verdict">{verdict}</p>
      </div>
    </div>
  );
}

// Simple language-specific starter templates
function getStarter(lang, q) {
  switch (lang) {
    case "python":
      return `# ${q.title}
# ${q.description}

def solve():
    # TODO: write your solution using input()
    # Example:
    # s = input().strip()
    # print(s == s[::-1])
    pass

if __name__ == "__main__":
    solve()
`;
    case "js":
      return `// ${q.title}
// ${q.description}
const fs = require('fs');
const input = fs.readFileSync(0, 'utf8').trim().split('\\n');

// TODO: parse input and print output
console.log("TODO");
`;
    case "c":
      return `// ${q.title}
// ${q.description}
#include <stdio.h>
int main() {
    // TODO: read from stdin with scanf / fgets and printf result
    printf("TODO\\n");
    return 0;
}
`;
    case "cpp":
      return `// ${q.title}
// ${q.description}
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // TODO: read input and print result
    cout << "TODO\\n";
    return 0;
}
`;
    case "java":
      return `// ${q.title}
// ${q.description}
import java.io.*;
import java.util.*;
public class Main {
  public static void main(String[] args) throws Exception {
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    // TODO: read input & print result
    System.out.println("TODO");
  }
}
`;
    default:
      return "";
  }
}
