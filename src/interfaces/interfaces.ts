type Attachment = {
    contentType: string;
    name?: string;
    url: string;
    };


type ToolArgs = Record<string, any>;
type ToolResultContent = any[];
interface ToolResult {
  content: ToolResultContent;
}
type ToolInvocationState = "pending" | "executing" | "result" | "error";

interface ToolInvocation {
  args: ToolArgs;
  result?: ToolResult;
  state: ToolInvocationState;
  step: number;
  toolCallId: string;
  toolName: string;
}

    
  
export interface message{
    content:string;
    role:string;
    id:string;
    experimental_attachments: Attachment[];
    toolInvocations: ToolInvocation[];
}

