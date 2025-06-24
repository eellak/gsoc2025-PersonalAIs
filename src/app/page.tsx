'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { cx } from 'classix';
import { Trash2 } from 'lucide-react';

import { Textarea } from 'ui/textarea';
import { toast } from 'sonner';
import { ArrowUpIcon } from 'lucide-react';
import { Button } from 'ui/button';
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { PreviewMessage, ThinkingMessage } from "@/components/custom/message";
import { motion } from 'framer-motion';
import UserProfile from '@/components/spotify/user-profile';
import { MusicIcon } from 'lucide-react';
import Queue from '@/components/spotify/queue';
import Greeting from '@/components/custom/greeting';

const suggestedActions = [
  {
    title: 'Recommend some',
    label: 'music for studying',
    action: 'Can you recommend some music that\'s good for studying?',
  },
  {
    title: 'Recommend some',
    label: 'music for workout',
    action: 'Can you recommend some music that\'s good for working out?',
  },
];

export default function Chat() {
  const { messages, input, setInput, handleSubmit, setMessages } = useChat();
  const [queueWidth, setQueueWidth] = useState(320); // 默认宽度
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();
  const [suggestionText, setSuggestionText] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFiles(event.target.files);
      const url = URL.createObjectURL(event.target.files[0]);
      setPreviewUrl(url);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (suggestionText && input === suggestionText) {
      handleSubmit(new Event('submit') as any, {
        experimental_attachments: undefined
      });
      setSuggestionText(null);
    }
  }, [input, suggestionText, handleSubmit]);

  const clearMessages = () => {
    setMessages([]);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartWidth.current = queueWidth;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = dragStartX.current - e.clientX;
      const newWidth = Math.max(200, Math.min(1000, dragStartWidth.current + deltaX));
      setQueueWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, queueWidth]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {messages.length > 0 && (
        <div className="fixed bottom-4 left-4 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur-sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Chat
          </Button>
        </div>
      )}
      <div className="flex h-full">
        <div className="flex-1 flex flex-col">
          <div className='flex-1 overflow-y-auto pt-4 pl-20 pr-20 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-black/20 hover:[&::-webkit-scrollbar-thumb]:bg-black/30 [&::-webkit-scrollbar-track]:bg-transparent' ref={messagesContainerRef}>
            {messages.length === 0 ? (
              <Greeting />
            ) : (
              messages.map((m) => (
                <div key={m.id} className="mb-6">
                  <PreviewMessage message={m} />
                </div>
              ))
            )}

            {isLoading && <ThinkingMessage />}
            <div ref={messagesEndRef} className="shrink-0 min-w-[24px] min-h-[24px]" />
          </div>

          <div className="fixed bottom-4 left-4 z-50">
            <UserProfile />
          </div>

          {messages.length === 0 && (
            <div className='flex flex-col items-center justify-center gap-2 px-4 py-2 bg-muted rounded-lg mx-4 mb-4'>
              <div className="hidden md:grid sm:grid-cols-2 gap-2 w-full max-w-[600px]">
                {suggestedActions.map((suggestedAction, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.05 * index }}
                    key={index}
                    className={index > 1 ? 'hidden sm:block' : 'block'}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const text = suggestedAction.action;
                        setSuggestionText(text);
                        setInput(text);
                      }}
                      className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
                    >
                      <span className="font-medium">{suggestedAction.title}</span>
                      <span className="text-muted-foreground">
                        {suggestedAction.label}
                      </span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className='flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl'>
            <form
              ref={formRef}
              className="w-full"
              onSubmit={event => {
                event.preventDefault();
                if (!isLoading) {
                  handleSubmit(event, {
                    experimental_attachments: files,
                  });

                  setFiles(undefined);
                  setPreviewUrl(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }
              }}
            >
              <div className="relative w-full flex flex-col gap-4">
                {previewUrl && (
                  <div className="absolute -left-14 top-1/2 -translate-y-1/2 w-12 h-12 rounded-lg overflow-hidden border shrink-0">
                    <Image
                      src={previewUrl}
                      alt="preview-img"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setFiles(undefined);
                      }}
                      className="absolute top-0 right-0 bg-black/50 text-white p-1 rounded-bl"
                    >
                      ×
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  className="absolute top-1/2 transform -translate-y-1/2 text-gray-500 opacity-0 cursor-pointer pl-1 w-10"
                  onChange={handleFileChange}
                  multiple
                  ref={fileInputRef}
                  accept="image/*"
                />

                <div className="absolute top-1/2 left-3 transform -translate-y-1/2 items-center justify-center text-gray-500 group-hover:text-black pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>

                <Textarea
                  placeholder="Send a message..."
                  className={cx(
                    'border-gray-300 min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-xl text-base bg-muted pl-10 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0',
                  )}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      const form = e.currentTarget.form;
                      if (form) {
                        form.requestSubmit();
                      }
                    }
                  }}
                  rows={3}
                  autoFocus
                />
                <Button
                  type="submit"
                  className="rounded-full p-1.5 h-8 w-8 flex items-center justify-center border dark:border-zinc-600 cursor-pointer absolute top-1/2 transform -translate-y-1/2 right-1 mr-1"
                  disabled={input.length === 0}
                >
                  <ArrowUpIcon size={14} />
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div 
          className="w-1 cursor-col-resize hover:bg-muted-foreground/20 active:bg-muted-foreground/30 transition-colors"
          onMouseDown={handleMouseDown}
        />
        <div className="hidden lg:block border-l bg-muted/50" style={{ width: `${queueWidth}px` }}>
          <Queue />
        </div>
      </div>
    </div>
  );
}

