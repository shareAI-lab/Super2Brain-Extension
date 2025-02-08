import { Loader2, Clock, Check, Download } from "lucide-react";

const classNames = (...classes) => classes.filter(Boolean).join(" ");

const getStatusIcon = (status) => {
  switch (status) {
    case 0:
      return <Clock className="w-4 h-4 text-white" />;
    case 1:
      return <Loader2 className="w-4 h-4 text-white animate-spin" />;
    case 2:
      return <Check className="w-4 h-4 text-white" />;
    case 3:
      return <Download className="w-4 h-4 text-white" />;
    default:
      return <Clock className="w-4 h-4 text-white" />;
  }
};

const getTextColorClass = (status) => {
  switch (status) {
    case 1: // 加载中
      return "text-blue-500";
    case 2: // 完成
      return "text-green-500";
    case 3: // 获取网页数据
      return "text-gray-500";
    default:
      return "text-gray-500";
  }
};

const getIconBackgroundClass = (status) => {
  switch (status) {
    case 1:
      return "bg-blue-500";
    case 2:
      return "bg-green-500";
    case 3:
      return "bg-gray-400";
    default:
      return "bg-gray-400";
  }
};

const TimeLine = ({ contentUrlList }) => {
  const renderLoadingState = () => (
    <div className="flex items-center space-x-2 p-3 bg-gray-50">
      <div className="animate-pulse flex space-x-1">
        <div className="h-2 w-2 bg-indigo-400 rounded-full"></div>
        <div className="h-2 w-2 bg-indigo-400 rounded-full"></div>
        <div className="h-2 w-2 bg-indigo-400 rounded-full"></div>
      </div>
    </div>
  );

  const isAllStatusZero = contentUrlList.every(event => event.status === 0);
  
  if (isAllStatusZero) {
    return null;
  }

  return (
    <div className="w-full">
      {contentUrlList.length === 0 ? (
        renderLoadingState()
      ) : (
        <div className="flow-root  p-4">
          <ul role="list" className="-mb-6">
            {contentUrlList.map((event, eventIdx) => (
              <li key={event.id}>
                <div className="relative pb-6">
                  {eventIdx !== contentUrlList.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-3 top-3 -ml-px h-full w-0.5 bg-gray-200"
                    />
                  ) : null}
                  <div className="relative flex space-x-2">
                    <div>
                      <span
                        className={classNames(
                          getIconBackgroundClass(event.status),
                          "flex size-6 items-center justify-center rounded-full ring-4 ring-white"
                        )}
                      >
                        {getStatusIcon(event.status)}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1">
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs truncate ${getTextColorClass(
                            event.status
                          )}`}
                        >
                          <a
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-gray-900 transition-colors"
                          >
                            {event.content}
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export { TimeLine };
