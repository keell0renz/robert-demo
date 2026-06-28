// mirror-ui — ChatComposer
// Compound dot-namespace API, tv() variants, headless useChatComposer hook, presets.
// Independently importable — no dependency on ChatThread or ChatLayout.

"use client";

import * as React from "react";
import {
  RiAddLine,
  RiAlertFill,
  RiArrowUpLine,
  RiAttachmentLine,
  RiCloseLine,
  RiFlashlightLine,
  RiImageLine,
  RiLoaderLine,
  RiStopCircleLine,
} from "@remixicon/react";

import { cn } from "@/lib/utils/cn";
import { tv, type VariantProps } from "@/components/ui/utils/tv";
import type { AttachmentItem } from "../_shared/types";

// ─── tv() Variants ──────────────────────────────────────────────────────────

const chatComposerVariants = tv({
  slots: {
    root: ["flex w-full flex-col", "transition-opacity duration-200"],
    upgradeBanner: ["flex items-center gap-1 px-2.5 py-2 lg:px-3 lg:py-2.5"],
    upgradeText: "text-foreground-soft flex items-center gap-1 text-xs font-medium",
    upgradeSep: "text-foreground-disabled text-xs font-medium",
    upgradeLink: "text-muted-foreground cursor-pointer text-xs font-medium hover:underline",
    surface: [
      "bg-card shadow-complex-2 flex cursor-text flex-col gap-2 rounded-[15px] p-2.5",
      "transition-all duration-200 lg:rounded-[19px] lg:p-3",
      // elevated surface → edge comes from shadow-complex-2 (soft ring in light, white-alpha
      // outline in dark). No focus ring — focus is conveyed by the textarea caret/content, not a
      // white outline on the whole surface.
    ],
    attachmentList: "flex flex-wrap gap-2",
    attachmentItem: ["bg-muted flex items-center gap-2 rounded-xl py-1.5 pr-2 pl-2", "ring-1 ring-inset ring-border"],
    attachmentItemError: "ring-error-light",
    attachmentThumb: "bg-card flex size-7 items-center justify-center rounded-full",
    attachmentName: "text-foreground tracking-spacing-tiny-2 max-w-[180px] truncate text-xs font-medium",
    attachmentExt: "text-foreground-soft text-[10px] font-medium uppercase",
    attachmentRemove: [
      "text-foreground-soft hover:text-foreground hover:bg-card",
      "inline-flex size-5 items-center justify-center rounded-md transition-colors duration-200",
    ],
    inputWrapper: "relative",
    inputPlaceholder: [
      "text-foreground-soft tracking-spacing-tiny-2 pointer-events-none absolute top-0 left-1 z-20",
      "pt-2.5 text-[14px] leading-5 duration-200 lg:pt-3.5 lg:text-[15px] lg:leading-6",
    ],
    input: [
      "text-foreground tracking-spacing-tiny-2 caret-text-strong-950",
      "relative z-30 block max-h-40 min-h-6 w-full resize-none overflow-y-auto border-0",
      "bg-transparent pt-2.5 pl-1 text-[14px] leading-5 outline-none",
      "focus:border-0 focus:ring-0 focus:outline-none",
      "lg:pt-3.5 lg:pb-6 lg:text-[15px] lg:leading-6",
    ],
    toolbar: "flex items-center justify-between",
    toolbarLeft: "flex items-center gap-2",
    attachMenuWrapper: "relative",
    attachMenuButton: ["group inline-flex size-7 cursor-pointer items-center justify-center rounded-lg p-0", "transition duration-200 outline-none"],
    attachMenuDropdown: ["bg-card shadow-regular-md absolute bottom-9 left-0 z-50 min-w-52 rounded-2xl p-1.5", "ring-1 ring-inset ring-border"],
    attachMenuItem: [
      "text-muted-foreground group/menu-item hover:bg-muted hover:text-foreground",
      "flex h-auto w-full cursor-pointer items-center justify-start gap-1.5 rounded-lg p-1.5",
      "text-xs font-medium transition duration-200",
    ],
    modelPicker: [
      "text-muted-foreground bg-muted hover:bg-accent hover:text-muted-foreground",
      "tracking-spacing-tiny-2 hidden h-7 cursor-pointer items-center gap-1 rounded-lg px-2",
      "text-sm font-medium transition duration-200 outline-none lg:flex",
    ],
    sendButton: ["group inline-flex size-7 cursor-pointer items-center justify-center rounded-lg p-0", "transition duration-200 outline-none"],
    stopButton: [
      "group inline-flex size-7 cursor-pointer items-center justify-center rounded-lg p-0",
      "bg-primary hover:bg-bg-surface-800 transition duration-200 outline-none",
    ],
  },
  variants: {
    showUpgrade: {
      true: {
        root: "bg-background rounded-[16px] p-0.5 lg:rounded-[20px]",
      },
    },
    disabled: {
      true: {
        root: "pointer-events-none opacity-50",
      },
    },
  },
  defaultVariants: {
    showUpgrade: false,
    disabled: false,
  },
});

type ChatComposerVariantProps = VariantProps<typeof chatComposerVariants>;

// ─── Context ────────────────────────────────────────────────────────────────

interface ChatComposerContextValue {
  variants: ChatComposerVariantProps;
}

const ChatComposerContext = React.createContext<ChatComposerContextValue>({
  variants: {},
});

// ─── Headless Hook ───────────────────────────────────────────────────────────

export interface UseChatComposerOptions {
  initialValue?: string;
  maxHeight?: number;
  onSubmit?: (value: string, attachments: AttachmentItem[]) => void;
  onStop?: () => void;
  isStreaming?: boolean;
}

export interface UseChatComposerReturn {
  value: string;
  setValue: (v: string) => void;
  attachments: AttachmentItem[];
  addAttachment: (item: AttachmentItem) => void;
  removeAttachment: (id: string) => void;
  canSend: boolean;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  autosize: () => void;
  handleSubmit: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

function useChatComposer(opts: UseChatComposerOptions = {}): UseChatComposerReturn {
  const { initialValue = "", maxHeight = 160, onSubmit, onStop, isStreaming = false } = opts;

  const [value, setValue] = React.useState(initialValue);
  const [attachments, setAttachments] = React.useState<AttachmentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const canSend = value.trim().length > 0 || attachments.length > 0;

  const autosize = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  }, [maxHeight]);

  const addAttachment = React.useCallback((item: AttachmentItem) => {
    setAttachments((prev) => [...prev, item]);
  }, []);

  const removeAttachment = React.useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleSubmit = React.useCallback(() => {
    if (isStreaming) {
      onStop?.();
      return;
    }
    if (!canSend || isSubmitting) return;
    onSubmit?.(value, attachments);
    setValue("");
    setAttachments([]);
    requestAnimationFrame(() => autosize());
  }, [isStreaming, canSend, isSubmitting, onSubmit, onStop, value, attachments, autosize]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return {
    value,
    setValue,
    attachments,
    addAttachment,
    removeAttachment,
    canSend,
    isSubmitting,
    setIsSubmitting,
    textareaRef,
    autosize,
    handleSubmit,
    handleKeyDown,
  };
}

// ─── Part: Root ──────────────────────────────────────────────────────────────

export interface ChatComposerRootProps extends React.HTMLAttributes<HTMLDivElement>, ChatComposerVariantProps {}

function ChatComposerRoot({ showUpgrade, disabled, className, children, ...rest }: ChatComposerRootProps) {
  const { root } = chatComposerVariants({ showUpgrade, disabled });
  const ctx = React.useMemo<ChatComposerContextValue>(() => ({ variants: { showUpgrade, disabled } }), [showUpgrade, disabled]);

  return (
    <ChatComposerContext.Provider value={ctx}>
      <div className={root({ class: className })} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    </ChatComposerContext.Provider>
  );
}
ChatComposerRoot.displayName = "ChatComposer.Root";

// ─── Part: UpgradeBanner ─────────────────────────────────────────────────────

export interface ChatComposerUpgradeBannerProps {
  upgradeLabel?: string;
  upgradeHref?: string;
  onUpgrade?: () => void;
  className?: string;
}

function ChatComposerUpgradeBanner({ upgradeLabel = "Upgrade", upgradeHref = "#", onUpgrade, className }: ChatComposerUpgradeBannerProps) {
  const { variants } = React.useContext(ChatComposerContext);
  const { upgradeBanner, upgradeText, upgradeSep, upgradeLink } = chatComposerVariants(variants);

  return (
    <div className={upgradeBanner({ class: className })}>
      <div className={upgradeText()}>
        <RiFlashlightLine className="size-4" />
        Access premium models &amp; features
      </div>
      <div className={upgradeSep()}>∙</div>
      <a
        href={upgradeHref}
        className={upgradeLink()}
        onClick={
          onUpgrade
            ? (e) => {
                e.preventDefault();
                onUpgrade();
              }
            : undefined
        }
      >
        {upgradeLabel}
      </a>
    </div>
  );
}
ChatComposerUpgradeBanner.displayName = "ChatComposer.UpgradeBanner";

// ─── Part: Surface ───────────────────────────────────────────────────────────

export interface ChatComposerSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  onClickFocus?: () => void;
}

function ChatComposerSurface({ onClickFocus, className, children, ...rest }: ChatComposerSurfaceProps) {
  const { variants } = React.useContext(ChatComposerContext);
  const { surface } = chatComposerVariants(variants);

  return (
    <div className={surface({ class: className })} onClick={onClickFocus} {...rest}>
      {children}
    </div>
  );
}
ChatComposerSurface.displayName = "ChatComposer.Surface";

// ─── Part: AttachmentList ────────────────────────────────────────────────────

export interface ChatComposerAttachmentListProps {
  attachments: AttachmentItem[];
  onRemove?: (id: string) => void;
  className?: string;
}

function ChatComposerAttachmentList({ attachments, onRemove, className }: ChatComposerAttachmentListProps) {
  const { variants } = React.useContext(ChatComposerContext);
  const { attachmentList, attachmentItem, attachmentItemError, attachmentThumb, attachmentName, attachmentExt, attachmentRemove } =
    chatComposerVariants(variants);

  if (attachments.length === 0) return null;

  return (
    <div className={attachmentList({ class: className })}>
      {attachments.map((att) => (
        <div key={att.id} className={cn(attachmentItem(), att.uploadStatus === "error" && attachmentItemError())}>
          <div className={attachmentThumb()}>
            {att.type === "image" ? (
              <RiImageLine className="text-muted-foreground size-4" />
            ) : att.uploadStatus === "uploading" ? (
              <RiLoaderLine className="text-muted-foreground size-4 animate-spin" />
            ) : att.uploadStatus === "error" ? (
              <RiAlertFill className="text-error-base size-4" />
            ) : (
              <RiAttachmentLine className="text-muted-foreground size-4" />
            )}
          </div>
          <div className="flex flex-col">
            <div className={attachmentName()}>{att.name}</div>
            <div className={attachmentExt()}>{att.ext}</div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.(att.id);
            }}
            className={attachmentRemove()}
            aria-label={`Remove ${att.name}`}
          >
            <RiCloseLine className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
ChatComposerAttachmentList.displayName = "ChatComposer.AttachmentList";

// ─── Part: Input ─────────────────────────────────────────────────────────────

export interface ChatComposerInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  disabled?: boolean;
  className?: string;
}

function ChatComposerInput({
  value,
  onChange,
  onKeyDown,
  placeholder = "How can I help you today?",
  textareaRef,
  disabled,
  className,
}: ChatComposerInputProps) {
  const { variants } = React.useContext(ChatComposerContext);
  const { inputWrapper, inputPlaceholder, input } = chatComposerVariants(variants);

  function autosize(el: HTMLTextAreaElement) {
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  return (
    <div className={inputWrapper({ class: className })}>
      {value.length === 0 && <span className={inputPlaceholder()}>{placeholder}</span>}
      <textarea
        ref={textareaRef}
        value={value}
        rows={1}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          autosize(e.currentTarget);
        }}
        onKeyDown={onKeyDown}
        className={input()}
        style={{ border: "none", outline: "none", boxShadow: "none" }}
      />
    </div>
  );
}
ChatComposerInput.displayName = "ChatComposer.Input";

// ─── Part: Toolbar ───────────────────────────────────────────────────────────

export type ChatComposerToolbarProps = React.HTMLAttributes<HTMLDivElement>;

function ChatComposerToolbar({ className, children, ...rest }: ChatComposerToolbarProps) {
  const { variants } = React.useContext(ChatComposerContext);
  const { toolbar } = chatComposerVariants(variants);
  return (
    <div className={toolbar({ class: className })} {...rest}>
      {children}
    </div>
  );
}
ChatComposerToolbar.displayName = "ChatComposer.Toolbar";

// ─── Part: ToolbarLeft ───────────────────────────────────────────────────────

export type ChatComposerToolbarLeftProps = React.HTMLAttributes<HTMLDivElement>;

function ChatComposerToolbarLeft({ className, children, ...rest }: ChatComposerToolbarLeftProps) {
  const { variants } = React.useContext(ChatComposerContext);
  const { toolbarLeft } = chatComposerVariants(variants);
  return (
    <div className={toolbarLeft({ class: className })} {...rest}>
      {children}
    </div>
  );
}
ChatComposerToolbarLeft.displayName = "ChatComposer.ToolbarLeft";

// ─── Part: AttachMenu ────────────────────────────────────────────────────────

export interface AttachMenuAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}

export interface ChatComposerAttachMenuProps {
  actions?: AttachMenuAction[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

function ChatComposerAttachMenu({ actions, open: controlledOpen, onOpenChange, className }: ChatComposerAttachMenuProps) {
  const { variants } = React.useContext(ChatComposerContext);
  const { attachMenuWrapper, attachMenuButton, attachMenuDropdown, attachMenuItem } = chatComposerVariants(variants);

  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setInternalOpen(false);
        onOpenChange?.(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onOpenChange]);

  const toggle = () => {
    const next = !open;
    setInternalOpen(next);
    onOpenChange?.(next);
  };

  const defaultActions: AttachMenuAction[] = [
    {
      id: "file",
      label: "Upload file",
      icon: RiAttachmentLine,
      onSelect: () => {
        setInternalOpen(false);
        onOpenChange?.(false);
      },
    },
    {
      id: "image",
      label: "Upload image",
      icon: RiImageLine,
      onSelect: () => {
        setInternalOpen(false);
        onOpenChange?.(false);
      },
    },
  ];

  const menuActions = actions ?? defaultActions;

  return (
    <div ref={menuRef} className={cn(attachMenuWrapper(), className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Attach file"
        className={cn(attachMenuButton(), open ? "bg-primary" : "bg-muted hover:bg-accent")}
      >
        <RiAddLine className={cn("size-5 duration-200", open ? "text-primary-foreground" : "text-foreground-soft group-hover:text-muted-foreground")} />
      </button>
      {open && (
        <div role="dialog" className={attachMenuDropdown()}>
          <div className="flex flex-col gap-0.5">
            {menuActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onSelect();
                    setInternalOpen(false);
                    onOpenChange?.(false);
                  }}
                  className={attachMenuItem()}
                >
                  {Icon && <Icon className="text-foreground-soft group-hover/menu-item:text-muted-foreground size-4" />}
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
ChatComposerAttachMenu.displayName = "ChatComposer.AttachMenu";

// ─── Part: ModelPicker ───────────────────────────────────────────────────────

export interface ChatComposerModelPickerProps {
  models?: string[];
  activeModel?: string;
  onModelChange?: (model: string) => void;
  className?: string;
}

function ChatComposerModelPicker({ models = ["GPT-4", "GPT-3.5"], activeModel, onModelChange, className }: ChatComposerModelPickerProps) {
  const { variants } = React.useContext(ChatComposerContext);
  const { modelPicker } = chatComposerVariants(variants);

  const [current, setCurrent] = React.useState(activeModel ?? models[0] ?? "");
  const model = activeModel !== undefined ? activeModel : current;

  const cycle = () => {
    const idx = models.indexOf(model);
    const next = models[(idx + 1) % models.length] ?? models[0] ?? model;
    setCurrent(next);
    onModelChange?.(next);
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        cycle();
      }}
      className={modelPicker({ class: className })}
      aria-label="Change model"
    >
      {model}
      <RiFlashlightLine className="text-foreground-soft size-4" />
    </button>
  );
}
ChatComposerModelPicker.displayName = "ChatComposer.ModelPicker";

// ─── Part: SendButton ────────────────────────────────────────────────────────

export interface ChatComposerSendButtonProps {
  canSend?: boolean;
  isStreaming?: boolean;
  isSubmitting?: boolean;
  disabled?: boolean;
  onSend?: () => void;
  onStop?: () => void;
  className?: string;
}

function ChatComposerSendButton({
  canSend = false,
  isStreaming = false,
  isSubmitting = false,
  disabled = false,
  onSend,
  onStop,
  className,
}: ChatComposerSendButtonProps) {
  const { variants } = React.useContext(ChatComposerContext);
  const { sendButton, stopButton } = chatComposerVariants(variants);

  if (isStreaming) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onStop?.();
        }}
        className={stopButton({ class: className })}
        aria-label="Stop generating"
      >
        <RiStopCircleLine className="text-primary-foreground size-5" />
      </button>
    );
  }

  const active = canSend && !disabled;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (active && !isSubmitting) onSend?.();
      }}
      disabled={!active || isSubmitting}
      aria-label="Send message"
      className={cn(
        sendButton({ class: className }),
        active ? "bg-primary hover:bg-bg-surface-800 disabled:cursor-not-allowed" : "bg-muted disabled:cursor-not-allowed",
      )}
    >
      {isSubmitting ? (
        <RiLoaderLine className={cn("size-5 animate-spin duration-200", active ? "text-primary-foreground" : "text-foreground-soft")} />
      ) : (
        <RiArrowUpLine
          className={cn(
            "size-5 duration-200",
            active ? "text-primary-foreground group-hover:text-primary-foreground" : "text-foreground-soft group-hover:text-muted-foreground",
          )}
        />
      )}
    </button>
  );
}
ChatComposerSendButton.displayName = "ChatComposer.SendButton";

// ─── Composed convenience component ─────────────────────────────────────────

export interface ChatComposerProps {
  /** Show the upgrade banner above the surface */
  showUpgrade?: boolean;
  /** Show the model picker in the toolbar */
  showModelPicker?: boolean;
  /** Controlled attachments list */
  attachments?: AttachmentItem[];
  onAttachmentsChange?: (attachments: AttachmentItem[]) => void;
  /** Available file types for attachment upload  */
  acceptedFileTypes?: string;
  /** Additional toolbar actions slot */
  toolbarActions?: React.ReactNode;
  /** Disclaimer slot (below surface) */
  disclaimer?: React.ReactNode;
  placeholder?: string;
  models?: string[];
  activeModel?: string;
  onModelChange?: (model: string) => void;
  /** Controlled value */
  value?: string;
  onValueChange?: (v: string) => void;
  onSubmit?: (value: string, attachments: AttachmentItem[]) => void;
  onStop?: () => void;
  /** Currently streaming — replaces send with stop */
  isStreaming?: boolean;
  /** Submitting state — spinner on send button */
  isSubmitting?: boolean;
  /** Hard-disable the whole composer */
  disabled?: boolean;
  className?: string;
}

function ChatComposerComposed({
  showUpgrade = false,
  showModelPicker = false,
  attachments: controlledAttachments,
  onAttachmentsChange,
  acceptedFileTypes,
  toolbarActions,
  disclaimer,
  placeholder,
  models,
  activeModel,
  onModelChange,
  value: controlledValue,
  onValueChange,
  onSubmit,
  onStop,
  isStreaming = false,
  isSubmitting = false,
  disabled = false,
  className,
}: ChatComposerProps) {
  const hook = useChatComposer({
    onSubmit,
    onStop,
    isStreaming,
  });

  const value = controlledValue !== undefined ? controlledValue : hook.value;
  const setValue = (v: string) => {
    hook.setValue(v);
    onValueChange?.(v);
  };
  const attachments = controlledAttachments !== undefined ? controlledAttachments : hook.attachments;
  const addAttachment = (item: AttachmentItem) => {
    hook.addAttachment(item);
    onAttachmentsChange?.([...attachments, item]);
  };
  const removeAttachment = (id: string) => {
    hook.removeAttachment(id);
    onAttachmentsChange?.(attachments.filter((a) => a.id !== id));
  };

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const canSend = value.trim().length > 0 || attachments.length > 0;

  const handleSend = () => {
    if (isStreaming) {
      onStop?.();
      return;
    }
    if (!canSend || isSubmitting || disabled) return;
    onSubmit?.(value, attachments);
    setValue("");
    removeAttachment("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <ChatComposerRoot showUpgrade={showUpgrade} disabled={disabled} className={className}>
      {showUpgrade && <ChatComposerUpgradeBanner />}

      <ChatComposerSurface onClickFocus={() => hook.textareaRef.current?.focus()}>
        {attachments.length > 0 && <ChatComposerAttachmentList attachments={attachments} onRemove={removeAttachment} />}

        <ChatComposerInput
          value={value}
          onChange={setValue}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          textareaRef={hook.textareaRef}
          disabled={disabled || isSubmitting}
        />

        <ChatComposerToolbar>
          <ChatComposerToolbarLeft>
            <ChatComposerAttachMenu
              actions={[
                {
                  id: "file",
                  label: "Upload file",
                  icon: RiAttachmentLine,
                  onSelect: () => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = acceptedFileTypes ?? "";
                      fileInputRef.current.click();
                    }
                  },
                },
                {
                  id: "image",
                  label: "Upload image",
                  icon: RiImageLine,
                  onSelect: () => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "image/*";
                      fileInputRef.current.click();
                    }
                  },
                },
              ]}
            />
            {showModelPicker && <ChatComposerModelPicker models={models} activeModel={activeModel} onModelChange={onModelChange} />}
            {toolbarActions}
          </ChatComposerToolbarLeft>

          <ChatComposerSendButton
            canSend={canSend}
            isStreaming={isStreaming}
            isSubmitting={isSubmitting}
            disabled={disabled}
            onSend={handleSend}
            onStop={onStop}
          />
        </ChatComposerToolbar>
      </ChatComposerSurface>

      {disclaimer && <div className="flex justify-center">{disclaimer}</div>}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            addAttachment({
              id: Math.random().toString(36).slice(2),
              name: f.name,
              ext: (f.name.split(".").pop() ?? "FILE").toUpperCase().slice(0, 4),
              type: f.type.startsWith("image/") ? "image" : "file",
            });
          }
          // reset so same file can be re-selected
          e.target.value = "";
        }}
      />
    </ChatComposerRoot>
  );
}
ChatComposerComposed.displayName = "ChatComposer";

// ─── Presets ─────────────────────────────────────────────────────────────────

function PresetSimple(props: Omit<ChatComposerProps, "showUpgrade" | "showModelPicker">) {
  return <ChatComposerComposed showUpgrade={false} showModelPicker={false} {...props} />;
}
PresetSimple.displayName = "ChatComposer.Presets.Simple";

function PresetWithModel(props: Omit<ChatComposerProps, "showModelPicker">) {
  return <ChatComposerComposed showModelPicker models={props.models ?? ["GPT-4o", "GPT-4", "GPT-3.5"]} {...props} />;
}
PresetWithModel.displayName = "ChatComposer.Presets.WithModel";

function PresetFull(props: ChatComposerProps) {
  return (
    <ChatComposerComposed
      showUpgrade
      showModelPicker
      models={props.models ?? ["GPT-4o", "GPT-4", "GPT-3.5"]}
      disclaimer={
        props.disclaimer ?? (
          <p className="text-foreground-soft text-xs">
            AI can make mistakes — please <span className="text-muted-foreground font-medium">double-check</span>
          </p>
        )
      }
      {...props}
    />
  );
}
PresetFull.displayName = "ChatComposer.Presets.Full";

const Presets = {
  Simple: PresetSimple,
  WithModel: PresetWithModel,
  Full: PresetFull,
};

// ─── Exports ─────────────────────────────────────────────────────────────────

export {
  ChatComposerRoot as Root,
  ChatComposerUpgradeBanner as UpgradeBanner,
  ChatComposerSurface as Surface,
  ChatComposerAttachmentList as AttachmentList,
  ChatComposerInput as Input,
  ChatComposerToolbar as Toolbar,
  ChatComposerToolbarLeft as ToolbarLeft,
  ChatComposerAttachMenu as AttachMenu,
  ChatComposerModelPicker as ModelPicker,
  ChatComposerSendButton as SendButton,
  ChatComposerComposed as ChatComposer,
  Presets,
  useChatComposer,
};
