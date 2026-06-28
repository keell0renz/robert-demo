import { anthropic } from "@ai-sdk/anthropic";
import { defineAgent } from "eve";

// The page-designing agent: Claude Opus 4.8 via the Anthropic provider
// directly (uses ANTHROPIC_API_KEY, no AI Gateway). Note the native id uses
// hyphens: `claude-opus-4-8`.
export default defineAgent({
  model: anthropic("claude-opus-4-8"),
});
