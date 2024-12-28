import OpenAI from "openai";

interface OpenAiServiceRequestOptions {
  model?: OpenAI.ChatModel;
  enforceJsonResponse?: boolean;
}

export const promptOpenAi = async (
  textPrompt: string,
  apiKey: string,
  options?: OpenAiServiceRequestOptions
) => {
  const client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const contentArray: OpenAI.ChatCompletionContentPart[] = [];

  contentArray.push({
    type: "text",
    text: textPrompt,
  });

  const params: OpenAI.Chat.ChatCompletionCreateParams = {
    messages: [
      {
        role: "user",
        content: contentArray,
      },
    ],
    model: options?.model || "gpt-4o",
  };

  if (options?.enforceJsonResponse) {
    params.response_format = {
      type: "json_object",
    };
  }

  try {
    const chatCompletion: OpenAI.Chat.ChatCompletion =
      await client.chat.completions.create(params);
    console.log("Chat completion:", JSON.stringify(chatCompletion, null, 2));
    return chatCompletion;
  } catch (error) {
    console.error("Error during chat completion:", error);
    throw error;
  }
};
