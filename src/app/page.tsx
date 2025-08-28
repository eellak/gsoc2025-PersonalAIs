'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { cx } from 'classix';
import { Trash2, LogOut } from 'lucide-react';

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
import CartesianPlane, { PointWithType } from '@/components/custom/cartesianplane';
import { signOut } from 'next-auth/react';

const savePointMeta = async (startPoint: PointWithType | null, endPoint: PointWithType | null) => {
  try {
    const response = await fetch('/api/point-meta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ startPoint, endPoint }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save point meta: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Point meta saved:', result);
    
    // Return the result so we can use it for immediate state update
    return result;
  } catch (error) {
    console.error('Error saving point meta:', error);
    return null;
  }
}

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

// coordinate to emotion
const coordinateToEmotion = (x: number, y: number) => {
  if (x < 0.5 && y < 0.5) {
    return 'sad';
  }
  if (x >= 0.5 && y < 0.5) {
    return 'relaxed';
  }
  if (x < 0.5 && y >= 0.5) {
    return 'angry';
  }
  if (x >= 0.5 && y >= 0.5) {
    return 'happy';
  }
};

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
  const [startPoint, setStartPoint] = useState<PointWithType | null>(null);
  const [endPoint, setEndPoint] = useState<PointWithType | null>(null);

  // Function to load point meta from file
  const loadPointMeta = async () => {
    try {
      const response = await fetch('/api/point-meta');
      if (response.ok) {
        const data = await response.json();
        if (data.start) {
          setStartPoint({ x: data.start.x, y: data.start.y, type: 'start' } as PointWithType);
        }
        if (data.end) {
          setEndPoint({ x: data.end.x, y: data.end.y, type: 'end' } as PointWithType);
        }
        console.log('Loaded point meta from file:', data);
      }
    } catch (error) {
      console.error('Error loading point meta:', error);
    }
  };

  // Load point meta when component mounts and set up periodic refresh
  useEffect(() => {
    loadPointMeta();
    
    // Set up periodic refresh every 5 seconds to sync with file changes
    const interval = setInterval(loadPointMeta, 5000);
    
    return () => clearInterval(interval);
  }, []);

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

  const handleLogout = async () => {
    await signOut({ redirect: false });
    const loginUri = process.env.NEXTAUTH_URL + '/login';
    const spotifyLogoutUrl = `https://accounts.spotify.com/logout?continue=${encodeURIComponent(loginUri)}`;

    window.location.href = spotifyLogoutUrl;
  };

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
      {(
        <div className="fixed top-4 right-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground hover:cursor-pointer w-8 h-8 bg-transparent hover:bg-transparent"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
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
                <div className="relative w-full flex items-center gap-2">
                  {/* 左侧文件预览 */}
                  {previewUrl && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden border shrink-0 relative">
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

                  {/* 上传 input 和图标 */}
                  <div className="relative flex items-center">
                    <input
                      type="file"
                      className="absolute w-6 h-6 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      multiple
                      ref={fileInputRef}
                      accept="image/*"
                    />
                    <div className="w-6 h-6 flex items-center justify-center text-gray-500 group-hover:text-black pointer-events-none">
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
                  </div>

                  {/* 文本框 */}
                  <Textarea
                    placeholder="Send a message..."
                    className={cx(
                      'flex-1 border-gray-300 min-h-[24px] max-h-[75dvh] resize-none rounded-xl text-base bg-muted pl-3 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0',
                    )}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                    rows={3}
                    autoFocus
                  />

                  {/* 发送按钮 */}
                  <Button
                    type="submit"
                    className="rounded-full p-1.5 h-8 w-8 flex items-center justify-center border dark:border-zinc-600 cursor-pointer"
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
                  className="cursor-pointer focus-visible:ring-2 focus-visible:ring-black hover:ring-2 text-sm"
                >
                  Detect <br />
                  Mood
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
                    onSubmit={async result => {
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
                      setStartPoint({ x: x, y: y, type: 'start' } as PointWithType);
                      const saveResult = await savePointMeta({ x: x, y: y, type: 'start' } as PointWithType, null);
                      if (saveResult?.data) {
                        // Update state with the saved data to ensure consistency
                        if (saveResult.data.start) {
                          setStartPoint({ x: saveResult.data.start.x, y: saveResult.data.start.y, type: 'start' } as PointWithType);
                        }
                      }
                      setOpenQuestionnaire(false);
                      
                      setMessages([...messages, 
                      {
                        role: 'user',
                        // random id
                        id: Math.random().toString(36).substring(2),
                        content: `Detect my mood with the questionnaire.`,
                      },
                      {
                        role: 'assistant',
                        // random id
                        id: Math.random().toString(36).substring(2),
                        content: `Are you feeling ${coordinateToEmotion(x, y)} about your mood?`,
                      }]);
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
              points={[(startPoint as PointWithType), (endPoint as PointWithType)].filter(Boolean)}
              onAddPoint={async (point) => {
                if (point.type === 'start') {
                  setStartPoint(point);
                  const saveResult = await savePointMeta(point, null);
                  if (saveResult?.data) {
                    // Update state with the saved data to ensure consistency
                    if (saveResult.data.start) {
                      setStartPoint({ x: saveResult.data.start.x, y: saveResult.data.start.y, type: 'start' } as PointWithType);
                    }
                  }
                } else {
                  setEndPoint(point);
                  const saveResult = await savePointMeta(null, point);
                  if (saveResult?.data) {
                    // Update state with the saved data to ensure consistency
                    if (saveResult.data.end) {
                      setEndPoint({ x: saveResult.data.end.x, y: saveResult.data.end.y, type: 'end' } as PointWithType);
                    }
                  }
                }
              }}
              setStartPoint={setStartPoint}
              setEndPoint={setEndPoint}
              savePointMeta={savePointMeta}
            />
          </div>
          <div className="flex-1 min-h-0">
            <Queue />
          </div>
        </div>
      </div>
    </div>
  );
}

