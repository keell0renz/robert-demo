// The stored UI tree shape (Path A — spec-over-code). The agent emits this as
// JSON, we persist it as Postgres jsonb, and `<Render>` walks it mapping
// `type` -> a primitive in the REGISTRY. Off-vocabulary nodes are unrenderable,
// not just ugly — that is the entire "the AI can't redesign anything" guardrail.
export type UINode = {
  type: string;
  props?: Record<string, unknown>;
  children?: UINode[];
};
