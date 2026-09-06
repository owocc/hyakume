import React from "react";
import {
  Sparkles,
  Wrench,
  Lightbulb,
  Target,
  ExternalLink,
  CheckCircle2,
  Code2,
  Share2,
} from "lucide-react";

interface Props {
  content: string;
  githubUrl?: string;
  xUrl?: string;
}

export function ArticleContentRenderer({ content, githubUrl, xUrl }: Props) {
  if (!content) return null;

  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockBuffer: string[] = [];
  let listBuffer: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = (key: string) => {
    if (!listBuffer) return;
    if (listBuffer.type === "ul") {
      elements.push(
        <ul key={key} className="space-y-2 my-4 pl-2">
          {listBuffer.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-base text-foreground/90 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span>{formatInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={key} className="space-y-2 my-4 pl-2">
          {listBuffer.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-base text-foreground/90 leading-relaxed">
              <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5 shrink-0">
                {idx + 1}
              </span>
              <span>{formatInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
    listBuffer = null;
  };

  const formatInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let index = 0;

    const regex = /\[([^\]]+)\]\(([^)]+)\)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      if (match[1] && match[2]) {
        parts.push(
          <a
            key={index++}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
          >
            <span>{match[1]}</span>
            <ExternalLink className="w-3 h-3 inline-block ml-0.5 opacity-70" />
          </a>
        );
      } else if (match[4]) {
        parts.push(
          <strong key={index++} className="font-bold text-foreground">
            {match[4]}
          </strong>
        );
      } else if (match[6]) {
        parts.push(
          <em key={index++} className="italic text-foreground/85">
            {match[6]}
          </em>
        );
      } else if (match[8]) {
        parts.push(
          <code
            key={index++}
            className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs font-medium border border-border"
          >
            {match[8]}
          </code>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (line.startsWith("```")) {
      flushList(`list-${i}`);
      if (inCodeBlock) {
        elements.push(
          <div
            key={`code-${i}`}
            className="my-5 rounded-2xl bg-neutral-950 text-neutral-200 p-4 font-mono text-xs overflow-x-auto border border-neutral-800 shadow-md"
          >
            <pre className="leading-relaxed">{codeBlockBuffer.join("\n")}</pre>
          </div>
        );
        codeBlockBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(rawLine);
      continue;
    }

    if (!line) {
      flushList(`list-${i}`);
      continue;
    }

    if (line === "---" || line === "***" || line === "___") {
      flushList(`list-${i}`);
      elements.push(
        <hr key={`hr-${i}`} className="my-8 border-t border-border" />
      );
      continue;
    }

    if (line.startsWith("# ")) {
      flushList(`list-${i}`);
      const text = line.replace(/^#\s+/, "");
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mt-8 mb-4 pt-2 flex items-center gap-2.5"
        >
          {formatInline(text)}
        </h1>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushList(`list-${i}`);
      const text = line.replace(/^##\s+/, "");
      let icon = <Sparkles className="w-5 h-5 text-primary shrink-0" />;
      if (text.includes("GitHub") || text.includes("代码") || text.includes("开源")) {
        icon = <Code2 className="w-5 h-5 text-foreground shrink-0" />;
      } else if (text.includes("Twitter") || text.includes("X") || text.includes("社群") || text.includes("社交")) {
        icon = <Share2 className="w-5 h-5 text-sky-500 shrink-0" />;
      } else if (text.includes("架构") || text.includes("功能")) {
        icon = <Wrench className="w-5 h-5 text-amber-500 shrink-0" />;
      } else if (text.includes("技巧") || text.includes("上手")) {
        icon = <Lightbulb className="w-5 h-5 text-emerald-500 shrink-0" />;
      } else if (text.includes("研判") || text.includes("人群")) {
        icon = <Target className="w-5 h-5 text-rose-500 shrink-0" />;
      }

      elements.push(
        <div key={`h2-${i}`} className="mt-8 mb-4 border-b border-border/70 pb-3">
          <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            {icon}
            <span>{formatInline(text)}</span>
          </h2>
        </div>
      );
      continue;
    }

    if (line.startsWith("### ")) {
      flushList(`list-${i}`);
      const text = line.replace(/^###\s+/, "");
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-base sm:text-lg font-bold text-foreground mt-6 mb-2 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span>{formatInline(text)}</span>
        </h3>
      );
      continue;
    }

    if (line.startsWith("> ")) {
      flushList(`list-${i}`);
      const text = line.replace(/^>\s+/, "");
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-5 pl-4 py-2 border-l-4 border-primary bg-card/60 rounded-r-2xl text-sm sm:text-base text-foreground/90 italic shadow-2xs"
        >
          {formatInline(text)}
        </blockquote>
      );
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const item = line.replace(/^[-*]\s+/, "");
      if (!listBuffer || listBuffer.type !== "ul") {
        flushList(`list-${i}`);
        listBuffer = { type: "ul", items: [item] };
      } else {
        listBuffer.items.push(item);
      }
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const item = line.replace(/^\d+\.\s+/, "");
      if (!listBuffer || listBuffer.type !== "ol") {
        flushList(`list-${i}`);
        listBuffer = { type: "ol", items: [item] };
      } else {
        listBuffer.items.push(item);
      }
      continue;
    }

    flushList(`list-${i}`);
    elements.push(
      <p
        key={`p-${i}`}
        className="text-sm sm:text-base text-foreground/90 leading-relaxed my-3 font-normal"
      >
        {formatInline(line)}
      </p>
    );
  }

  flushList("list-end");

  return (
    <div className="article-body space-y-2 leading-relaxed text-foreground">
      {elements}
    </div>
  );
}
