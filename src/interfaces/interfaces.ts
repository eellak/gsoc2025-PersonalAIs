type Attachment = {
    contentType: string;
    name?: string;
    url: string;
    };

  
export interface message{
    content:string;
    role:string;
    id:string;
    experimental_attachments: Attachment[];
}

