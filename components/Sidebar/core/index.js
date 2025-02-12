import OpenAI from "openai";
import { config } from "../../config/index";


const getResponse = async (query, userInput) => {
  const openai = new OpenAI({
    apiKey: userInput,
    baseURL: `${config.baseUrl}/v1`,
    dangerouslyAllowBrowser: true,
  });

  const response = await openai.chat.completions.create({
    messages: [{ role: "user", content: query }],
    model: "gpt-4o",
  });
  return response.choices[0].message.content;
};