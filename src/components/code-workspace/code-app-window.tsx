"use client";

import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { WindowFrame } from "@/os/primitives/Window";
import { AppErrorBoundary, RuntimeError, compileApp } from "@/code/runtime";

// Frame controls the window manager owns (the generated code only supplies the
// body; the title comes from the tool's `title` arg).
type FrameControls = {
  z?: number;
  hidden?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  offset?: number;
  storageKey?: string;
};

// A Path-B app rendered into a manager-owned window. Same chrome as Path A's
// AppWindow (so the desktop is identical), but the body is the model's React
// SOURCE compiled in the browser instead of a walked JSON tree.
//
// The trick is timing: the code streams in token by token, so for most of the
// generation it's a half-written file that can't compile. We DON'T flash a
// compile error during that window — instead we show the code typing out, and
// only render the real app once it actually compiles. A genuine syntax error is
// shown only after streaming finishes (`streaming` is false).
export function CodeAppWindow({
  title,
  code,
  streaming,
  ...frame
}: { title: string; code: string; streaming: boolean } & FrameControls) {
  // Recompile only when the source changes. While streaming this re-runs each
  // token — cheap (Sucrase is fast).
  const compiled = useMemo(() => compileApp(code), [code]);

  let body: ReactNode;
  if (compiled.ok) {
    body = (
      <AppErrorBoundary resetKey={code}>
        <compiled.Component />
      </AppErrorBoundary>
    );
  } else if (streaming) {
    // Not compilable yet AND still streaming → show the code being written
    // instead of a (transient, misleading) syntax error.
    body = <CodeStreaming code={code} />;
  } else {
    // Streaming is done and it still won't compile → a real error worth showing.
    body = <RuntimeError message={compiled.error} />;
  }

  return (
    <WindowFrame title={title} {...frame}>
      <div className="os-root" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {body}
      </div>
    </WindowFrame>
  );
}

// The "watch it write the app" view: the streaming React source in a monospace
// pane, auto-scrolled to the newest line, with a small shimmer header. This
// turns the generation wait into the demo's best moment — you see real code
// being written, then it compiles and runs.
function CodeStreaming({ code }: { code: string }) {
  const ref = useRef<HTMLPreElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [code]);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--os-content-bg)",
        color: "var(--os-text)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderBottom: "1px solid var(--os-hairline)",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <span
          className="animate-pulse"
          style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--os-accent)" }}
        />
        <span className="chat-shimmer-text">Writing React…</span>
      </div>
      <pre
        ref={ref}
        style={{
          margin: 0,
          flex: 1,
          overflow: "auto",
          padding: 16,
          fontSize: 11.5,
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
          color: "var(--os-text-secondary)",
        }}
      >
        {code}
        <span style={{ color: "var(--os-accent)" }}>▋</span>
      </pre>
    </div>
  );
}
