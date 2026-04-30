import fs from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";

interface LegalPageProps {
  title: string;
  filename: string;
}

export async function LegalPage({ title, filename }: LegalPageProps) {
  const filePath = path.join(process.cwd(), "src", "content", filename);
  const content = await fs.readFile(filePath, "utf-8");

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-zinc-300">
      <h1 className="mb-12 text-balance text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
        {title}
      </h1>
      <article className="space-y-4 leading-relaxed">
        <ReactMarkdown
          components={{
            h2: ({ children }) => (
              <h2 className="mt-12 mb-4 text-2xl font-bold text-white">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="mt-10 mb-3 text-xl font-bold text-[var(--color-brand)]">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="whitespace-pre-line">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="ml-6 list-disc space-y-1 marker:text-[var(--color-brand)]">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="ml-6 list-decimal space-y-1 marker:text-[var(--color-brand)]">{children}</ol>
            ),
            a: ({ children, href }) => (
              <a
                href={href}
                className="text-[var(--color-brand)] underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-white">{children}</strong>
            ),
            hr: () => <hr className="my-12 border-[var(--color-border)]" />,
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
