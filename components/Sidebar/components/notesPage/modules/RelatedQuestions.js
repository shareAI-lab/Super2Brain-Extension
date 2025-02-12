import { HelpCircle } from "lucide-react";
import { QuestionLoading } from "./realtedLoading";

const RelatedQuestions = ({ message, setQuery }) => {
  return (
    <>
      {message.questionsLoading && (
        <div className="mt-2 w-full ml-2">
          <div className="flex items-center gap-2 mb-2 text-gray-600">
            <HelpCircle className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">猜你想问</span>
          </div>
          <QuestionLoading />
        </div>
      )}

      {!message.questionsLoading && message.aboutQuestion?.length > 0 && (
        <div className="mt-2 w-full ml-2">
          <div className="flex items-center gap-2 mb-2 text-gray-600">
            <HelpCircle className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">猜你想问</span>
          </div>
          <div className="space-y-1 w-full">
            {message.aboutQuestion.map((question, index) => (
              <button
                key={index}
                onClick={() => setQuery(question)}
                className="block text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 
                  rounded-lg p-2 w-full text-left transition-colors duration-200"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export { RelatedQuestions };
