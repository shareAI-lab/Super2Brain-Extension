import { Sparkles, Diamond, ChevronRight } from "lucide-react";
import { memo, useMemo } from "react";
import { marked } from "marked";

const titleStyles = {
  h1: "text-lg font-semibold mb-4",
  h2: "text-base font-medium mb-3 text-gray-800",
  h3: "text-lg font-semibold mb-2 text-gray-700",
  h4: "text-base font-medium mb-2 text-gray-600",
};

const parseMarkdown = (content) => {
  const parseLineContent = (line) => line.replace(/^[#\-\s]+/, "").trim();

  const categorizeLines = (line) => ({
    type: line.startsWith("# ")
      ? "h1"
      : line.startsWith("## ")
      ? "h2"
      : line.startsWith("- ")
      ? "list"
      : "text",
    content: parseLineContent(line),
  });

  const buildStructure = (lines) =>
    lines.reduce((structure, line) => {
      const { type, content } = categorizeLines(line);

      if (!structure.length && type !== "h1") {
        structure.push({ type: "h1", title: "未分类", children: [] });
      }

      const currentSection = structure[structure.length - 1];

      switch (type) {
        case "h1":
          structure.push({ type: "h1", title: content, children: [] });
          break;
        case "h2":
          if (currentSection) {
            currentSection.children.push({
              type: "h2",
              title: content,
              content: [],
            });
          }
          break;
        case "list":
          if (currentSection) {
            const lastH2 = currentSection.children[
              currentSection.children.length - 1
            ] || { type: "h2", title: "", content: [] };

            if (!currentSection.children.length) {
              currentSection.children.push(lastH2);
            }

            lastH2.content.push(content);
          }
          break;
      }

      return structure;
    }, []);

  const lines = content.split("\n").filter(Boolean);
  return buildStructure(lines);
};

const ListItem = memo(({ content, theme = "blue" }) => (
  <li className="text-gray-600 mb-2 flex items-start gap-2 text-sm">
    <ChevronRight
      className={`w-3 h-3 mt-1 ${
        theme === "red" ? "text-red-400" : "text-blue-400"
      }`}
    />
    <span
      className="flex-1"
      dangerouslySetInnerHTML={{ __html: marked.parseInline(content) }}
    />
  </li>
));

const H1Section = memo(({ title, children = [], theme = "blue" }) => (
  <div className="mb-6">
    <h1 className={`${titleStyles.h1} flex items-center gap-2`}>
      <Sparkles
        className={`w-5 h-5 ${
          theme === "red" ? "text-red-500" : "text-blue-500"
        }`}
        strokeWidth={1.5}
      />
      {title}
    </h1>
    <div className="pl-6 space-y-4">
      {children.map((h2, idx) => (
        <H2Section key={idx} {...h2} theme={theme} />
      ))}
    </div>
  </div>
));

const H2Section = memo(({ title, content = [], theme = "blue" }) => (
  <div className="relative">
    <div className="absolute left-[-24px] top-0 bottom-0 w-px bg-gray-100" />
    <h2 className={`${titleStyles.h2} flex items-center gap-2`}>
      <Diamond
        className={`w-4 h-4 ${
          theme === "red" ? "text-red-400" : "text-blue-400"
        }`}
        strokeWidth={1.5}
      />
      {title}
    </h2>
    <ul className="list-none pl-6">
      {content.map((item, idx) => (
        <ListItem key={idx} content={item} theme={theme} />
      ))}
    </ul>
  </div>
));

const MarkdownRenderer = ({ content = "", criticalAnalysis = "" }) => {
  const sections = useMemo(
    () => (content ? parseMarkdown(content) : []),
    [content]
  );

  const analysis = useMemo(
    () => (criticalAnalysis ? parseMarkdown(criticalAnalysis) : []),
    [criticalAnalysis]
  );

  return (
    <div className="w-full h-full bg-white rounded-xl">
      <div className="p-8 w-full">
        {sections.map((section, idx) => (
          <H1Section key={idx + "sections1"} {...section} theme="blue" />
        ))}
        {analysis.map((section, idx) => (
          <H1Section key={idx + "analysis1"} {...section} theme="red" />
        ))}
      </div>
    </div>
  );
};

export { MarkdownRenderer };
