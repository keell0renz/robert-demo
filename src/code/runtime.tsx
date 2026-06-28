"use client";

import React from "react";
import * as ReactJSXRuntime from "react/jsx-runtime";
import { transform } from "sucrase";

// THE PATH-B ENGINE — the deliberate opposite of src/os/Render.tsx. Where that
// walks a closed JSON vocabulary with no eval, this takes the React SOURCE the
// model wrote, compiles it in the browser (Sucrase: strip types, JSX -> calls,
// ESM -> CJS), and EVALUATES it with `new Function`. There is no sandbox. That
// is unsafe by construction and entirely the point: the contrast is the demo.

export type CompiledResult =
  | { ok: true; Component: React.ComponentType }
  | { ok: false; error: string };

// Only `react` resolves. Anything else throws a readable error the window shows,
// rather than a cryptic ReferenceError deep in eval.
function requireShim(name: string): unknown {
  if (name === "react") return React;
  if (name === "react/jsx-runtime") return ReactJSXRuntime;
  if (name === "react/jsx-dev-runtime") return ReactJSXRuntime;
  throw new Error(
    `Cannot import "${name}". Path-B apps may only import from "react".`,
  );
}

// Data helpers handed to every generated app as globals (no import needed). They
// route through our same-origin /api/proxy so the app can call ANY public API
// without tripping CORS. This is what lets the demo do real things — live clock,
// weather, crypto price, a random joke — not just static UI.
async function fetchJSON(url: string): Promise<unknown> {
  const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.error ?? "";
    } catch {
      /* ignore */
    }
    throw new Error(`fetchJSON failed (${res.status})${detail ? `: ${detail}` : ""}`);
  }
  return res.json();
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`fetchText failed (${res.status})`);
  return res.text();
}

export function compileApp(source: string): CompiledResult {
  let js: string;
  try {
    js = transform(source, {
      transforms: ["typescript", "jsx", "imports"],
      jsxRuntime: "automatic",
      production: true,
    }).code;
  } catch (err) {
    return { ok: false, error: `Compile error: ${messageOf(err)}` };
  }

  try {
    const mod = { exports: {} as Record<string, unknown> };
    // React + hooks are also injected as bare globals so an app that forgets to
    // `import { useState }` still runs — the require shim covers the rest.
    const run = new Function(
      "require",
      "module",
      "exports",
      "React",
      "useState",
      "useEffect",
      "useRef",
      "useMemo",
      "useCallback",
      "useReducer",
      "Fragment",
      "fetchJSON",
      "fetchText",
      js,
    );
    run(
      requireShim,
      mod,
      mod.exports,
      React,
      React.useState,
      React.useEffect,
      React.useRef,
      React.useMemo,
      React.useCallback,
      React.useReducer,
      React.Fragment,
      fetchJSON,
      fetchText,
    );

    const exported = (mod.exports.default ?? mod.exports) as unknown;
    if (typeof exported !== "function") {
      return {
        ok: false,
        error: "The app did not default-export a React component named `App`.",
      };
    }
    return { ok: true, Component: exported as React.ComponentType };
  } catch (err) {
    return { ok: false, error: `Evaluation error: ${messageOf(err)}` };
  }
}

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

// A render-time crash in generated code must stay LOCAL — one window shows the
// error, the desktop survives. Class component because that's the only way to
// catch render errors in a child tree.
export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode; resetKey: string },
  { error: string | null }
> {
  constructor(props: { children: React.ReactNode; resetKey: string }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  // When the code changes (e.g. the model updates the app), clear the error so
  // the new version gets a fresh render attempt.
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return <RuntimeError message={`Runtime error: ${this.state.error}`} />;
    }
    return this.props.children;
  }
}

// The in-window error panel — used for both compile/eval failures and render
// crashes. Styled with the same tokens the apps use so it reads as macOS.
export function RuntimeError({ message }: { message: string }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 20,
        background: "var(--os-content-bg)",
        color: "var(--os-text)",
        overflow: "auto",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--os-red)" }}>
        This app couldn’t run
      </div>
      <pre
        style={{
          margin: 0,
          fontSize: 12,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
          color: "var(--os-text-secondary)",
        }}
      >
        {message}
      </pre>
    </div>
  );
}
