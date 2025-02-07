import { Bot } from "lucide-react";
import { TimeLine } from "./timeLine.js";
import { marked } from "marked";

export const MessageRenderer = ({ messages }) => {
  const renderUserMessage = (msg, index) => (
    <div key={`user-${index}`} className="space-y-2">
      <div className="text-blue-600 flex justify-end">
        <div className="text-sm whitespace-pre-wrap bg-blue-100 rounded-lg p-2 max-w-[80%]">
          {msg.content}
        </div>
      </div>
    </div>
  );

  const renderAssistantMessage = (msg, index) => (
    <div key={`assistant-${index}`} className="space-y-2">
      <div className="text-gray-800">
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white p-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-indigo-600">{msg.model}:</span>
            </div>
          </div>

          <div>
            {!msg.isEasySearch && (
              <TimeLine contentUrlList={msg.urlListData || []} />
            )}
            {msg.content && (
              <div
                className="text-sm break-words leading-relaxed prose prose-sm max-w-none p-4"
                dangerouslySetInnerHTML={{
                  __html: marked(msg.content || "", {
                    breaks: true,
                    gfm: true,
                  }),
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return messages.map((msg, index) =>
    msg.role === "user"
      ? renderUserMessage(msg, index)
      : renderAssistantMessage(msg, index)
  );
};
