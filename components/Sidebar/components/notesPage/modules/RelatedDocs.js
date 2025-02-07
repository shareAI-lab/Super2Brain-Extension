import { FileText, ChevronDown, ChevronRight, File } from "lucide-react";

const RelatedDocs = ({ message, expandedDocs, onToggleExpand }) => {
    
  const isExpanded = expandedDocs[`${message.id}-docs`];

  return (
    <div className="mt-2">
      <div
        className={`flex items-center gap-1 cursor-pointer hover:bg-indigo-50 p-2 rounded-lg`}
        onClick={() => onToggleExpand(message.id, "docs")}
      >
        <FileText className="w-4 h-4 text-indigo-500" />
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-indigo-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-indigo-500" />
        )}
        <div className="text-sm font-medium text-indigo-600">
          相关文档 ({message.related.length})
        </div>
      </div>
      {isExpanded && (
        <div className="border border-indigo-100 rounded-lg">
          <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-gray-100">
            <ul className="space-y-1 list-none m-0 p-2">
              {message.related.map((doc, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between text-sm text-gray-600 hover:text-indigo-700 cursor-pointer p-1 hover:bg-indigo-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-indigo-400" />
                    <span>{doc.title}</span>
                  </div>
                  <span className="text-xs text-indigo-500 font-medium">
                    20%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export { RelatedDocs };
