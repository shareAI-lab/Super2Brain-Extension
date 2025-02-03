export class ChatStream {
  constructor(noteId, token = 'shareai-lm86isrosixq0j3qn7hgd2xeaa2ruydl') {
    this.token = token;
    this.abortController = null;
    const baseApiUrl = 'https://s2bapi.zima.pet'
    this.baseUrl = noteId
      ? `${baseApiUrl}/common/chat/stream/${noteId}`
      : `${baseApiUrl}/common/chat/stream`;
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async chatStream(messages, onMessage, onError, options) {
    if (!this.token) {
      onError(new Error('No token provided'))
      return;
    }

    const maxRetries = 3;
    let retryCount = 0;

    const attemptStream = async () => {
      try {
        this.abortController = new AbortController();

        const response = await fetch(this.baseUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            messages: messages,
            language: options?.language,
            agent: options?.agent,
            model_type: options?.model_type,
          }),
          signal: this.abortController.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`
          );
        }

        if (!response.body) {
          console.error("Response body is null");
          throw new Error("Response body is null");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            const chunk = decoder.decode(value);

            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.trim() === "") continue;
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  onMessage(parsed?.content || "");
                } catch (e) {
                  console.error("Error parsing JSON:", e, "Raw data:", data);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        console.error('Stream error:', error)
        if (error.name === 'AbortError') {
          console.log('Request aborted')
          return;
        }
        if (retryCount < maxRetries) {
          retryCount++;
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount)
          );
          return attemptStream();
        }
        onError(error);
      }
    };

    await attemptStream();
  }
}
