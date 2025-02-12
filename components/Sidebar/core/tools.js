export const availableTools = {
  webSearch: {
    description: "Search the web for information",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The query to search the web for",
        },
      },
    },
    execute: async (query) => {
      const urls = await extractUrls(query);
      return urls;
    },
  },
};
