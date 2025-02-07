const FooterCheck = () => {
  return (
    <div className="sticky bottom-0 w-full flex flex-col justify-between gap-x-8 gap-y-4 bg-white p-6 ring-1 ring-gray-900/10 rounded-b-xl md:flex-row md:items-center">
      <div className="flex items-center gap-x-3">
        <input
          type="checkbox"
          id="dont-show-again"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
        />
        <p className="text-sm/6 text-gray-900">
          每次打开Super2Brain侧边栏的时候，会自动在生成速览。
          <a href="#" className="font-semibold text-indigo-600">
            不再提示
          </a>
        </p>
      </div>
    </div>
  );
};

export { FooterCheck };
