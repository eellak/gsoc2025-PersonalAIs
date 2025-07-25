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
import Questionnaire, { Question } from '@/components/custom/questionnaire';
import CartesianPlane from '@/components/custom/cartesianplane';

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

// Questionnaire score mapping, double dictionary structure
const questionnaireScores: Record<string, Record<string, [number, number]>> = {
  q1: {
    'Strongly Agree': [0, 0],
    'Agree': [0.125, 0.125],
    'Can’t Say': [0, 0],
    'Disagree': [0.375, 0.375],
    'Strongly Disagree': [0.5, 0.5],
  },
  q2: {
    'Strongly Agree': [0, 0],
    'Agree': [0.125, 0.125],
    'Can’t Say': [0, 0],
    'Disagree': [0.375, 0.375],
    'Strongly Disagree': [0.5, 0.5],
  },
  q3: {
    'Strongly Agree': [0, 0],
    'Agree': [0.25, 0.25],
    'Can’t Say': [0, 0],
    'Disagree': [0.75, 0.75],
    'Strongly Disagree': [1, 1],
  },
  q4: {
    'Strongly Agree': [1, 1],
    'Agree': [0.75, 0.75],
    'Can’t Say': [0, 0],
    'Disagree': [0.25, 0.25],
    'Strongly Disagree': [0, 0],
  },
  q5: {
    'Strongly Agree': [1, 1],
    'Agree': [0.75, 0.75],
    'Can’t Say': [0, 0],
    'Disagree': [0.25, 0.25],
    'Strongly Disagree': [0, 0],
  },
  q6: {
    'Strongly Agree': [1, 1],
    'Agree': [0.75, 0.75],
    'Can’t Say': [0, 0],
    'Disagree': [0.25, 0.25],
    'Strongly Disagree': [0, 0],
  },
  q7: {
    'Strongly Agree': [0, 1],
    'Agree': [0.25, 1],
    'Can’t Say': [0, 0],
    'Disagree': [0.75, 1],
    'Strongly Disagree': [1, 1],
  },
  q8: {
    'Strongly Agree': [1, 0],
    'Agree': [0.75, 0],
    'Can’t Say': [0, 0],
    'Disagree': [0.25, 0],
    'Strongly Disagree': [0, 0],
  },
  q9: {
    'Strongly Agree': [0, 1],
    'Agree': [0.25, 0.75],
    'Can’t Say': [0, 0],
    'Disagree': [0.75, 0.25],
    'Strongly Disagree': [1, 0],
  },
};

export default function Chat() {
  const { messages, input, setInput, handleSubmit, setMessages } = useChat();
  const [queueWidth, setQueueWidth] = useState(320); // Default width
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
  const [openQuestionnaire, setOpenQuestionnaire] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([
    { x: 1, y: 2 },
    { x: -2, y: -1 },
  ]);

  const isAtBottomRef = useRef(true);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkIsNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const threshold = 100; // 阈值，单位像素
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  useEffect(() => {
    if (checkIsNearBottom()) {
      scrollToBottom();
    }
  }, [messages]);

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
    <div className="flex flex-col h-screen min-h-screen overflow-hidden bg-background">
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
              (() => {
                console.log('PreviewMSG:', messages);
                return messages.map((m) => (
                  <div key={m.id} className="mb-6">
                    <PreviewMessage message={m} />
                  </div>
                ));
              })()
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
            {/* form and questionnaire button in the same row */}
            <div className="flex w-full flex-row items-start gap-2">
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
              {/* Questionnaire modal button */}
              <div className="flex items-center ml-2 mt-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenQuestionnaire(true)}
                  className="cursor-pointer focus-visible:ring-2 focus-visible:ring-black hover:ring-2"
                >
                  Detect
                </Button>
              </div>
            </div>
            {openQuestionnaire && (
              <div style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{background: '#fff', padding: 24, borderRadius: 8, minWidth: 320, minHeight: 150, maxHeight: '90vh', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', overflowY: 'auto'}}>
                  <button style={{position: 'absolute', top: 8, right: 8, border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer'}} onClick={() => setOpenQuestionnaire(false)}>×</button>
                  <h3 style={{marginBottom: 16}}>Detect Your Mood</h3>
                  <Questionnaire
                    questions={[
                      { type: 'radio', label: 'I don’t feel like doing anything.', name: 'q1', options: ['Strongly Agree', 'Agree', 'Can’t Say', 'Disagree', 'Strongly Disagree'] },
                      { type: 'radio', label: 'I am feeling bored.', name: 'q2', options: ['Strongly Agree', 'Agree', 'Can’t Say', 'Disagree', 'Strongly Disagree'] },
                      { type: 'radio', label: 'Nothing seems fun anymore. / I hardly enjoy anything.', name: 'q3', options: ['Strongly Agree', 'Agree', 'Can’t Say', 'Disagree', 'Strongly Disagree'] },
                      { type: 'radio', label: 'I find beauty in things around me.', name: 'q4', options: ['Strongly Agree', 'Agree', 'Can’t Say', 'Disagree', 'Strongly Disagree'] },
                      { type: 'radio', label: 'I feel loved.', name: 'q5', options: ['Strongly Agree', 'Agree', 'Can’t Say', 'Disagree', 'Strongly Disagree'] },
                      { type: 'radio', label: 'I’ve been feeling confident.', name: 'q6', options: ['Strongly Agree', 'Agree', 'Can’t Say', 'Disagree', 'Strongly Disagree'] },
                      { type: 'radio', label: 'I feel like my opinion/efforts are not appreciated.', name: 'q7', options: ['Strongly Agree', 'Agree', 'Can’t Say', 'Disagree', 'Strongly Disagree'] },
                      { type: 'radio', label: 'I have completed today’s agenda.', name: 'q8', options: ['Strongly Agree', 'Agree', 'Can’t Say', 'Disagree', 'Strongly Disagree'] },
                      { type: 'radio', label: 'I get irritated easily.', name: 'q9', options: ['Strongly Agree', 'Agree', 'Can’t Say', 'Disagree', 'Strongly Disagree'] }
                    ]}
                    onSubmit={result => {
                      const filteredEntries = Object.entries(result).filter(
                        ([_, value]) => value !== "Can’t Say"
                      );
                      const filledCount = filteredEntries.length;
                      const scores = Object.entries(result).reduce((acc, [key, value]) => {
                        const score = questionnaireScores[key]?.[value] || [0, 0];
                        acc[0] += score[0];
                        acc[1] += score[1];
                        return acc;
                      }, [0, 0]);
                      console.log('Scores:', scores);
                      console.log('filledCount:', filledCount);
                      const x = scores[0] / filledCount;
                      const y = scores[1] / filledCount;
                      console.log(`Normalized Scores: x=${x.toFixed(3)}, y=${y.toFixed(3)}`);
                      setPoints([...points, { x: x, y: y }]);
                      setOpenQuestionnaire(false);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div 
          className="w-1 cursor-col-resize hover:bg-muted-foreground/20 active:bg-muted-foreground/30 transition-colors"
          onMouseDown={handleMouseDown}
        />
        <div className="hidden lg:flex flex-col border-l h-full" style={{ width: `${queueWidth}px` }}>
          <div className="p-4 border-b">
            <h3 className="text-sm font-medium mb-2">Emotion Map</h3>
            <CartesianPlane
              points={points}
              onAddPoint={(point) => {
                setPoints([...points, point]);
              }}
            />
            <div className="mt-2 flex gap-2">
              <Button
                className="flex-1"
                onClick={() =>
                  setPoints([
                    ...points,
                    {
                      x: parseFloat((Math.random()).toFixed(3)),
                      y: parseFloat((Math.random()).toFixed(3)),
                    },
                  ])
                }
              >
                Add Random Point
              </Button>
              <Button
                className="flex-1"
                onClick={() => setPoints([])}
              >
                Clean
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <Queue />
          </div>
        </div>
      </div>
    </div>
  );
}

