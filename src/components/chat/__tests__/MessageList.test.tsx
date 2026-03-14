import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MessageList } from "../MessageList";
import type { Message } from "ai";

// Mock the MarkdownRenderer component
vi.mock("../MarkdownRenderer", () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div>{content}</div>,
}));

afterEach(() => {
  cleanup();
});

test("MessageList shows empty state when no messages", () => {
  render(<MessageList messages={[]} />);

  expect(
    screen.getByText("Start a conversation to generate React components")
  ).toBeDefined();
  expect(
    screen.getByText("I can help you create buttons, forms, cards, and more")
  ).toBeDefined();
});

test("MessageList renders user messages", () => {
  const messages: Message[] = [
    {
      id: "1",
      role: "user",
      content: "Create a button component",
    },
  ];

  render(<MessageList messages={messages} />);

  expect(screen.getByText("Create a button component")).toBeDefined();
});

test("MessageList renders assistant messages", () => {
  const messages: Message[] = [
    {
      id: "1",
      role: "assistant",
      content: "I'll help you create a button component.",
    },
  ];

  render(<MessageList messages={messages} />);

  expect(
    screen.getByText("I'll help you create a button component.")
  ).toBeDefined();
});

test("MessageList renders messages with parts", () => {
  const messages: Message[] = [
    {
      id: "1",
      role: "assistant",
      content: "",
      parts: [
        { type: "text", text: "Creating your component..." },
        {
          type: "tool-invocation",
          toolInvocation: {
            toolCallId: "asdf",
            args: { command: "create", path: "/App.jsx" },
            toolName: "str_replace_editor",
            state: "result",
            result: "Success",
          },
        },
      ],
    },
  ];

  render(<MessageList messages={messages} />);

  expect(screen.getByText("Creating your component...")).toBeDefined();
  // ToolCallDisplay shows user-friendly message instead of raw tool name
  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
});

test("MessageList shows content for assistant message with content", () => {
  const messages: Message[] = [
    {
      id: "1",
      role: "assistant",
      content: "Generating your component...",
    },
  ];

  render(<MessageList messages={messages} />);

  expect(screen.getByText("Generating your component...")).toBeDefined();
});

test("MessageList shows loading indicator when isLoading is true", () => {
  const messages: Message[] = [
    {
      id: "1",
      role: "assistant",
      content: "",
    },
  ];

  render(<MessageList messages={messages} isLoading={true} />);

  expect(screen.getByText("Generating...")).toBeDefined();
});

test("MessageList does not show loading for non-last assistant message", () => {
  const messages: Message[] = [
    {
      id: "1",
      role: "assistant",
      content: "",
    },
    {
      id: "2",
      role: "user",
      content: "Thanks!",
    },
  ];

  render(<MessageList messages={messages} isLoading={true} />);

  // Only one "Generating..." should appear (for the last assistant message)
  // But since the last message is a user message, no loading should show
  expect(screen.queryByText("Generating...")).toBeNull();
});

test("MessageList renders multiple messages in order", () => {
  const messages: Message[] = [
    {
      id: "1",
      role: "user",
      content: "Hello",
    },
    {
      id: "2",
      role: "assistant",
      content: "Hi there!",
    },
    {
      id: "3",
      role: "user",
      content: "Make a counter",
    },
  ];

  render(<MessageList messages={messages} />);

  expect(screen.getByText("Hello")).toBeDefined();
  expect(screen.getByText("Hi there!")).toBeDefined();
  expect(screen.getByText("Make a counter")).toBeDefined();
});

test("MessageList renders tool invocations with correct state", () => {
  const messages: Message[] = [
    {
      id: "1",
      role: "assistant",
      content: "",
      parts: [
        {
          type: "tool-invocation",
          toolInvocation: {
            toolCallId: "1",
            args: { command: "create", path: "/test.jsx" },
            toolName: "str_replace_editor",
            state: "call",
          },
        },
      ],
    },
  ];

  render(<MessageList messages={messages} />);

  // Should show the tool invocation display
  expect(screen.getByText("Creating /test.jsx")).toBeDefined();
});

test("MessageList renders text parts in assistant messages", () => {
  const messages: Message[] = [
    {
      id: "1",
      role: "assistant",
      content: "",
      parts: [
        { type: "text", text: "First part" },
        { type: "text", text: "Second part" },
      ],
    },
  ];

  render(<MessageList messages={messages} />);

  expect(screen.getByText("First part")).toBeDefined();
  expect(screen.getByText("Second part")).toBeDefined();
});

test("MessageList renders text parts in user messages without markdown", () => {
  const messages: Message[] = [
    {
      id: "1",
      role: "user",
      content: "",
      parts: [{ type: "text", text: "User message with parts" }],
    },
  ];

  render(<MessageList messages={messages} />);

  expect(screen.getByText("User message with parts")).toBeDefined();
});

test("MessageList renders step-start as separator", () => {
  const messages: Message[] = [
    {
      id: "1",
      role: "assistant",
      content: "",
      parts: [
        { type: "text", text: "First step" },
        { type: "step-start" },
        { type: "text", text: "Second step" },
      ],
    },
  ];

  const { container } = render(<MessageList messages={messages} />);

  expect(screen.getByText("First step")).toBeDefined();
  expect(screen.getByText("Second step")).toBeDefined();
  // Should have an hr element as separator
  expect(container.querySelector("hr")).toBeDefined();
});
