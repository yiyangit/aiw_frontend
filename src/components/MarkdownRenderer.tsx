'use client';

import { useEffect, useState } from 'react';
import { renderMarkdownToHTML } from '@/lib/markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [katexLoaded, setKatexLoaded] = useState(false);

  useEffect(() => {
    // Load KaTeX dynamically
    const loadKatex = async () => {
      if (typeof window !== 'undefined' && !katexLoaded) {
        try {
          const katex = await import('katex');
          (window as any).katex = katex;
          setKatexLoaded(true);
        } catch (error) {
          // Failed to load KaTeX
        }
      }
    };

    loadKatex();
  }, [katexLoaded]);

  useEffect(() => {
    if (katexLoaded) {
      setHtmlContent(renderMarkdownToHTML(content));
    } else {
      // Fallback to basic HTML conversion
      setHtmlContent(renderMarkdownToHTML(content));
    }
  }, [content, katexLoaded]);

  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}