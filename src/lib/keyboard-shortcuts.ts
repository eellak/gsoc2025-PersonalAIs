"use client";

export type Shortcut = {
  description?: string;
  shortcut: {
    key?: string;
    shift?: boolean;
    command?: boolean;
    backspace?: boolean;
  };
};

const openNewChatShortcut: Shortcut = {
  description: "New Chat",
  shortcut: {
    key: "O",
    shift: true,
    command: true,
  },
};

const toggleTemporaryChatShortcut: Shortcut = {
  description: "Toggle Temporary Chat",
  shortcut: {
    key: "K",
    command: true,
  },
};

const toggleSidebarShortcut: Shortcut = {
  description: "Toggle Sidebar",
  shortcut: {
    key: "S",
    command: true,
    shift: true,
  },
};

const toolModeShortcut: Shortcut = {
  description: "Tool Mode",
  shortcut: {
    key: "P",
    command: true,
  },
};

const lastMessageCopyShortcut: Shortcut = {
  description: "Copy Last Message",
  shortcut: {
    key: "C",
    command: true,
    shift: true,
  },
};

const openChatPreferencesShortcut: Shortcut = {
  description: "Customize Chat Preferences",
  shortcut: {
    key: "I",
    command: true,
    shift: true,
  },
};

const deleteThreadShortcut: Shortcut = {
  description: "Delete Chat",
  shortcut: {
    backspace: true,
    shift: true,
  },
};

const openShortcutsPopupShortcut: Shortcut = {
  description: "Open Shortcuts Popup",
  shortcut: {
    key: "/",
    command: true,
  },
};

export const Shortcuts = {
  openNewChat: openNewChatShortcut,
  openChatPreferences: openChatPreferencesShortcut,
  toggleTemporaryChat: toggleTemporaryChatShortcut,
  toggleSidebar: toggleSidebarShortcut,
  lastMessageCopy: lastMessageCopyShortcut,
  deleteThread: deleteThreadShortcut,
  toolMode: toolModeShortcut,
  openShortcutsPopup: openShortcutsPopupShortcut,
};

export const isShortcutEvent = (
  event: KeyboardEvent,
  { shortcut }: Shortcut,
) => {
  if (shortcut.command && !event.metaKey && !event.ctrlKey) return false;

  if (shortcut.shift && !event.shiftKey) return false;

  if (shortcut.key && shortcut.key?.toLowerCase() !== event.key?.toLowerCase())
    return false;

  if (shortcut.backspace && event.key?.toLowerCase() !== "backspace")
    return false;

  return true;
};
export const getShortcutKeyList = ({ shortcut }: Shortcut): string[] => {
  const keys: string[] = [];
  if (shortcut.command) {
    keys.push("⌘");
  }
  if (shortcut.shift) {
    keys.push("Shift");
  }
  if (shortcut.key) {
    keys.push(shortcut.key);
  }
  if (shortcut.backspace) {
    keys.push("⌫");
  }
  return keys;
};
