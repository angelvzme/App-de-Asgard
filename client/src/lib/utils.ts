import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parses text and converts URLs to clickable <a> elements
export function parseNotesWithLinks(text: string): React.ReactNode {
  if (!text) return null;
  const urlPattern = /https?:\/\/[^\s]+/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = urlPattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    nodes.push(
      React.createElement("a", {
        key: match.index,
        href: match[0],
        target: "_blank",
        rel: "noopener noreferrer",
        className: "text-primary hover:underline break-all",
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
      }, match[0])
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes.length > 0 ? nodes : text;
}
