import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from './hljs';

// Cấu hình marked: tô màu cú pháp cho khối code bằng highlight.js.
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Custom renderer để áp dụng highlight cho code block.
const renderer = new marked.Renderer();
renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlighted = hljs.highlight(text, { language }).value;
  return `<pre class="hljs-pre"><code class="hljs language-${language}">${highlighted}</code></pre>`;
};

// Chuyển Markdown -> HTML đã được làm sạch (chống XSS - Yêu cầu 10.2).
export function renderMarkdown(markdown: string): string {
  const rawHtml = marked.parse(markdown, { renderer, async: false }) as string;
  return DOMPurify.sanitize(rawHtml, {
    ADD_ATTR: ['class'],
  });
}
