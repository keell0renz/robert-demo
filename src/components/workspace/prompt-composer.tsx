"use client";

import * as Composer from "@/components/blocks/chat/chat-composer";

// A text-only composer built from the customs-os ChatComposer primitives (no
// file/image attach menu — the agent designs UI, it doesn't take uploads).
// Same surface, autosize, and Enter-to-send behavior as the customs-os copilot.
export function PromptComposer({
  onSend,
  isStreaming = false,
  onStop,
  placeholder = "Describe the page you want…",
  disabled,
}: {
  onSend: (text: string) => void;
  isStreaming?: boolean;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const hook = Composer.useChatComposer({
    onSubmit: (value) => onSend(value),
    onStop,
    isStreaming,
  });

  return (
    <Composer.Root disabled={disabled}>
      <Composer.Surface onClickFocus={() => hook.textareaRef.current?.focus()}>
        <Composer.Input
          value={hook.value}
          onChange={hook.setValue}
          onKeyDown={hook.handleKeyDown}
          placeholder={placeholder}
          textareaRef={hook.textareaRef}
        />
        <Composer.Toolbar>
          <Composer.ToolbarLeft />
          <Composer.SendButton
            canSend={hook.canSend}
            isStreaming={isStreaming}
            onSend={hook.handleSubmit}
            onStop={onStop}
          />
        </Composer.Toolbar>
      </Composer.Surface>
    </Composer.Root>
  );
}
