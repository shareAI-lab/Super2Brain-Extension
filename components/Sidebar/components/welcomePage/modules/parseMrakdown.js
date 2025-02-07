import { Sparkles, Diamond, ChevronRight } from "lucide-react";
import { memo } from "react";
import { marked } from "marked";

const titleStyles = {
  h1: "text-lg font-semibold mb-4",
  h2: "text-base font-medium mb-3 text-gray-800",
  h3: "text-lg font-semibold mb-2 text-gray-700",
  h4: "text-base font-medium mb-2 text-gray-600",
};

const parseMarkdown = (content) => {
  const parseLine = (line) => ({
    isH1: line.startsWith("# "),
    isH2: line.startsWith("## "),
    isListItem: line.startsWith("- "),
    content: line.replace(/^[#\-\s]+/, "").trim(),
  });

  const groupBySection = (acc, line) => {
    const { isH1, isH2, isListItem, content } = parseLine(line);

    if (isH1) {
      acc.push({ type: "h1", title: content, children: [] });
      return acc;
    }

    if (!acc.length) {
      acc.push({ type: "h1", title: "未分类", children: [] });
    }

    const currentSection = acc[acc.length - 1];

    if (isH2) {
      currentSection.children.push({ type: "h2", title: content, content: [] });
      return acc;
    }

    if (isListItem) {
      if (!currentSection.children.length) {
        currentSection.children.push({ type: "h2", title: "", content: [] });
      }
      const lastH2 =
        currentSection.children[currentSection.children.length - 1];
      lastH2.content.push(content);
    }

    return acc;
  };

  return content
    .split("\n")
    .filter((line) => line.trim())
    .reduce(groupBySection, []);
};

const ListItem = memo(({ content }) => (
  <li className="text-gray-600 mb-2 flex items-start gap-2 text-sm">
    <ChevronRight className="w-3 h-3 mt-1 text-blue-400" />
    <span
      className="flex-1"
      dangerouslySetInnerHTML={{ __html: marked.parseInline(content) }}
    />
  </li>
));

const H1Section = memo(({ title, children = [] }) => (
  <div className="mb-6">
    <h1 className={`${titleStyles.h1} flex items-center gap-2`}>
      <Sparkles className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
      {title}
    </h1>
    <div className="pl-6 space-y-4">
      {children.map((h2, idx) => (
        <H2Section key={idx} {...h2} />
      ))}
    </div>
  </div>
));

const H2Section = memo(({ title, content = [] }) => (
  <div className="relative">
    <div className="absolute left-[-24px] top-0 bottom-0 w-px bg-gray-100" />
    <h2 className={`${titleStyles.h2} flex items-center gap-2`}>
      <Diamond className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
      {title}
    </h2>
    <ul className="list-none pl-6">
      {content.map((item, idx) => (
        <ListItem key={idx} content={item} />
      ))}
    </ul>
  </div>
));

const H3Section = memo(({ title, children = [] }) => (
  <div className="mb-6 pl-6 relative">
    <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200" />
    <h3 className={`${titleStyles.h3} flex items-center gap-2`}>
      <span className="w-3 h-3 bg-blue-500 rounded-full relative">
        <span className="absolute -left-[1px] top-1/2 h-px w-4 bg-gray-200" />
      </span>
      {title}
    </h3>
    <div className="pl-4">
      {children.map((h4, idx) => (
        <H4Section key={idx} {...h4} />
      ))}
    </div>
  </div>
));

const H4Section = memo(({ title, content = [] }) => (
  <div className="mb-4 pl-6 relative">
    <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200" />
    <h4 className={`${titleStyles.h4} flex items-center gap-2`}>
      <span className="w-2 h-2 bg-blue-400 rounded-full relative">
        <span className="absolute -left-[1px] top-1/2 h-px w-4 bg-gray-200" />
      </span>
      {title}
    </h4>
    <ul className="list-none">
      {content.map((item, idx) => (
        <ListItem key={idx} content={item} />
      ))}
    </ul>
  </div>
));

const MarkdownRenderer = ({ content = "" }) => {
  const sections = content ? parseMarkdown(content) : [];

  return (
    <div className="w-full h-full bg-white rounded-xl overflow-hidden">
      <div className="p-8 w-full max-w-full h-full overflow-y-auto">
        {sections.map((section, idx) => (
          <H1Section key={idx} {...section} />
        ))}
      </div>
    </div>
  );
};

export { MarkdownRenderer };
