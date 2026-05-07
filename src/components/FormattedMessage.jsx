import React, { useMemo } from "react";

const allowedTags = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "span",
  "strong",
  "u",
  "ul",
]);

const allowedAttributes = {
  a: new Set(["href", "title", "target", "rel"]),
  span: new Set(["class"]),
};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+|mailto:[^\s)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function markdownToHtml(markdown) {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = [];
  let ordered = false;

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push(`<p>${paragraph.map(inlineMarkdown).join("<br/>")}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    blocks.push(`<${ordered ? "ol" : "ul"}>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${ordered ? "ol" : "ul"}>`);
    list = [];
    ordered = false;
  }

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push(`<h${heading[1].length}>${inlineMarkdown(heading[2])}</h${heading[1].length}>`);
      return;
    }

    const bullet = /^[-*]\s+(.+)$/.exec(trimmed);
    const numbered = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (bullet || numbered) {
      flushParagraph();
      const nextOrdered = Boolean(numbered);
      if (list.length && ordered !== nextOrdered) flushList();
      ordered = nextOrdered;
      list.push((bullet || numbered)[1]);
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();
  return blocks.join("");
}

function isSafeHref(value) {
  return /^(https?:\/\/|mailto:|\/)/i.test(value || "");
}

function sanitizeHtml(html) {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return escapeHtml(html);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html || ""}</div>`, "text/html");

  function clean(node) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) return;
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove();
        return;
      }

      const tag = child.tagName.toLowerCase();
      if (!allowedTags.has(tag)) {
        if (["script", "style", "iframe", "object", "embed"].includes(tag)) {
          child.remove();
          return;
        }
        child.replaceWith(...Array.from(child.childNodes));
        clean(node);
        return;
      }

      Array.from(child.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const allowed = allowedAttributes[tag]?.has(name);
        if (!allowed || name.startsWith("on")) {
          child.removeAttribute(attribute.name);
          return;
        }
        if (name === "href" && !isSafeHref(attribute.value)) {
          child.removeAttribute(attribute.name);
        }
      });

      if (tag === "a") {
        child.setAttribute("rel", "noreferrer");
        if (child.getAttribute("href")?.startsWith("http")) child.setAttribute("target", "_blank");
      }

      clean(child);
    });
  }

  clean(doc.body);
  return doc.body.firstElementChild?.innerHTML || "";
}

function toHtml(message, format) {
  if (format === "rich_text") return sanitizeHtml(message);
  if (format === "markdown") {
    const looksLikeHtml = /<\/?(h[1-4]|p|ul|ol|li|strong|b|em|i|a|blockquote|br|hr|code|pre)\b/i.test(message || "");
    return sanitizeHtml(looksLikeHtml ? message : markdownToHtml(message));
  }
  return "";
}

export function FormattedMessage({ message, format = "plain", className = "" }) {
  const html = useMemo(() => toHtml(message, format), [format, message]);

  if (format === "plain") {
    return <p className={`whitespace-pre-wrap ${className}`}>{message}</p>;
  }

  return (
    <div
      className={`mch-formatted-message ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
