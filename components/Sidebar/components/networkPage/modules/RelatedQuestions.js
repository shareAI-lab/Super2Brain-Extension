import { HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

const QuestionLoading = () => {
  const ballCount = 5;
  const balls = Array.from({ length: ballCount }, (_, index) => (
    <motion.div
      key={index}
      className="w-2 h-2 bg-blue-500 rounded-full"
      animate={{
        y: [0, -8, 0],
        x: [0, 4, 0],
        scale: [1, 0.8, 1],
      }}
      transition={{
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.1,
      }}
    />
  ));

  return (
    <div className="flex justify-start items-center h-full pt-2">
      <div className="flex space-x-1">{balls}</div>
    </div>
  );
};

export const RelatedQuestions = ({ message, setQuery }) => {
  return (
    <>
      {message.questionsLoading && (
        <div className="mt-2 ml-2">
          <div className="flex items-center gap-2 mb-2 text-gray-600">
            <HelpCircle className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">猜你想问</span>
          </div>
          <QuestionLoading />
        </div>
      )}

      {!message.questionsLoading && message.relatedQuestions?.length > 0 && (
        <div className="mt-2 ml-2">
          <div className="flex items-center gap-2 mb-2 text-gray-600">
            <HelpCircle className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">猜你想问</span>
          </div>
          <div className="space-y-1">
            {message.relatedQuestions.map((question, index) => (
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
