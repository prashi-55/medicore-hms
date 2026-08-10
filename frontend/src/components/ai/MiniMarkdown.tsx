/**
 * A deliberately small markdown renderer covering what the AI assistant actually
 * produces: paragraphs, **bold**, and "- " bullet lists. Avoids pulling in a full
 * markdown dependency for a narrow, controlled use case.
 */
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function MiniMarkdown({ content }: { content: string }) {
  const blocks = content.split(/\n\s*\n/);

  return (
    <div className="space-y-3">
      {blocks.map((block, idx) => {
        const lines = block.split("\n").filter(Boolean);
        const isList = lines.length > 0 && lines.every((l) => l.trim().startsWith("- "));

        if (isList) {
          return (
            <ul key={idx} className="list-disc space-y-1 pl-5">
              {lines.map((line, i) => (
                <li key={i}>{renderInline(line.trim().replace(/^- /, ""))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={idx} className="leading-relaxed">
            {lines.map((line, i) => (
              <span key={i}>
                {renderInline(line)}
                {i < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
