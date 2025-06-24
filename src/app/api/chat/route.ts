import { streamText, Message } from 'ai';
import { ModelProvider } from '@/lib/ai/provider';

export async function POST(req: Request) {
    const { messages }: { messages: Message[] } = await req.json();
    console.log("Received messages:", messages);

    const result = streamText({
        model: ModelProvider['qwen'],
        messages,
    });

    // const response = await result.toDataStreamResponse();
    // console.log("Final response text:", response);
    
    return result.toDataStreamResponse({
        getErrorMessage: error => {
          if (error instanceof Error) {
            return error.message;
          }
          console.error(error);
          return 'An unknown error occurred.';
        },
      });
}


