import showdown from 'showdown';
import 'katex/dist/katex.min.css';

const converter = new showdown.Converter({
  tables: true,
  strikethrough: true,
  emoji: true,
  parseImgDimensions: true,
  disableInline: true, // Disable some inline parsing that interferes with LaTeX
});

export function renderMarkdownToHTML(markdown: string): string {
  // First protect LaTeX delimiters from markdown processing
  let processed = markdown;

  // Store LaTeX blocks temporarily
  const inlineMathBlocks: string[] = [];
  const blockMathBlocks: string[] = [];

  // Use HTML comments as placeholders - they won't be processed by markdown
  const placeholderPrefix = 'LATEX_PLACEHOLDER_';

  // Protect block math $$...$$
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    const index = blockMathBlocks.length;
    blockMathBlocks.push(formula);
    return `<!--${placeholderPrefix}BLOCK_${index}-->`;
  });

  // Protect inline math $...$
  // Updated regex to handle multi-line math expressions within a single $...$ pair
  processed = processed.replace(/\$([\s\S]*?)\$/g, (match, formula) => {
    // Trim whitespace from the formula but preserve internal structure
    const trimmedFormula = formula.trim();
    const index = inlineMathBlocks.length;
    inlineMathBlocks.push(trimmedFormula);
    return `<!--${placeholderPrefix}INLINE_${index}-->`;
  });

  // Convert markdown to HTML
  let html = converter.makeHtml(processed);

  // Restore and render block math
  blockMathBlocks.forEach((formula, index) => {
    const placeholder = `<!--${placeholderPrefix}BLOCK_${index}-->`;
    html = html.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), () => {
      try {
        if (typeof window !== 'undefined' && (window as any).katex) {
          return (window as any).katex.renderToString(formula, { displayMode: true });
        }
      } catch (e) {
        console.error('KaTeX rendering error:', e);
      }
      return `$$${formula}$$`;
    });
  });

  // Restore and render inline math
  inlineMathBlocks.forEach((formula, index) => {
    const placeholder = `<!--${placeholderPrefix}INLINE_${index}-->`;
    html = html.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), () => {
      try {
        if (typeof window !== 'undefined' && (window as any).katex) {
          return (window as any).katex.renderToString(formula, { displayMode: false });
        }
      } catch (e) {
        console.error('KaTeX rendering error:', e);
      }
      return `$${formula}$`;
    });
  });

  return html;
}