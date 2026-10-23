"use client";

import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface KaTeXRendererProps {
  content: string;
  className?: string;
}

export const KaTeXRenderer: React.FC<KaTeXRendererProps> = ({ content, className = "" }) => {
  // تقسیم متن بر اساس بلوک‌های فرمول ($$...$$ یا $...$)
  const renderFormattedContent = () => {
    if (!content) return null;

    // رگولار اکسپرشن برای یافتن $$...$$ و $...$
    const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith("$$") && part.endsWith("$$")) {
        // فرمول بلاکی
        const math = part.slice(2, -2);
        try {
          const html = katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="my-2 block overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <code key={index}>{part}</code>;
        }
      } else if (part.startsWith("$") && part.endsWith("$")) {
        // فرمول درون‌خطی
        const math = part.slice(1, -1);
        try {
          const html = katex.renderToString(math, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="inline-block px-1 align-middle"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <code key={index}>{part}</code>;
        }
      } else {
        // متن عادی
        return <span key={index}>{part}</span>;
      }
    });
  };

  return <div className={`katex-wrapper leading-relaxed ${className}`}>{renderFormattedContent()}</div>;
};
