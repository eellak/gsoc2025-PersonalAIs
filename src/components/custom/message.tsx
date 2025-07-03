import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cx } from 'classix';
import { SparklesIcon } from './icons';
import ReactMarkdown from 'react-markdown';
import 'github-markdown-css/github-markdown.css';
import { UIMessage } from '@ai-sdk/ui-utils';
import { MessageActions } from '@/components/custom/actions';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import type { ToolInvocationUIPart } from '@ai-sdk/ui-utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getOrCreateRecommendPlaylist, addTrackToPlaylist } from '@/lib/spotify';
import { X } from 'lucide-react';
const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

export const PreviewMessage = ({ message }: { message: UIMessage; }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { data: session } = useSession();

  // recall_all_tracks rendering
  let allRecallTracks: any[] = [];
  (message.parts || []).forEach((part: any) => {
    if (
      part.type === 'tool-invocation' &&
      typeof part.toolInvocation === 'object' &&
      part.toolInvocation?.toolName === 'recall_all_tracks'
    ) {
      const toolInvocation = part.toolInvocation;
      if (toolInvocation.state === 'result' && toolInvocation.result && toolInvocation.result.content) {
        const content = toolInvocation.result.content[0]?.text;
        if (content) {
          try {
            const data = JSON.parse(content);
            if (data.success && data?.recall_tracks) {
              allRecallTracks = data?.recall_tracks;
              message.content = data?.content;
            }
          } catch (e) {
            // ignore
          }
        }
      }
    }
  });

  const [visibleRecallTracks, setVisibleRecallTracks] = useState<any[]>([]);
  const [recallQueue, setRecallQueue] = useState<any[]>([]);

  useEffect(() => {
    if (allRecallTracks.length > 0) {
      setVisibleRecallTracks(allRecallTracks.slice(0, 10));
      setRecallQueue(allRecallTracks.slice(10));
    }
  }, [JSON.stringify(allRecallTracks)]);

  // if using recall_all_tracks 
  const isRecalling = (message.parts || []).some(
    (part: any) =>
      part.type === 'tool-invocation' &&
      typeof part.toolInvocation === 'object' &&
      part.toolInvocation?.toolName === 'recall_all_tracks');

  const handleAddTrack = async (track: any) => {
    if (!session?.accessToken) {
      toast.error('Please login in first!');
      return;
    }
    try {
      // get or create recommend playlist
      const playlistId = await getOrCreateRecommendPlaylist(session.accessToken);
      // add tracks
      await addTrackToPlaylist(session.accessToken, playlistId, track.uri);
      toast.success(`Successfully to add "${track.name}" to recommend playlist`);
      setVisibleRecallTracks(prev => {
        const idx = prev.findIndex(t => t.id === track.id);
        let next = prev.filter(t => t.id !== track.id);
        if (recallQueue.length > 0) {
          next = [...next, recallQueue[0]];
          setRecallQueue(q => q.slice(1));
        }
        return next;
      });
    } catch (e) {
      toast.error('Fail to add');
    }
  };

  console.log("PreviewMessage", message);
  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >

      <div className='flex'>
      {message.role === 'assistant' ? (
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border mr-2 bg-gradient-to-br from-green-400 via-emerald-400 to-lime-300 shadow-lg">
          <SparklesIcon size={14} />
        </div>
      ) : null}
      <div
        className={cx(
          'group-data-[role=user]/message:bg-gradient-to-br group-data-[role=user]/message:from-blue-500 group-data-[role=user]/message:via-indigo-500 group-data-[role=user]/message:to-violet-500 group-data-[role=user]/message:text-white flex gap-4 group-data-[role=user]/message:px-4 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-3 rounded-2xl shadow-lg backdrop-blur-sm',
          'group-data-[role=assistant]/message:bg-gradient-to-br group-data-[role=assistant]/message:from-white/90 group-data-[role=assistant]/message:to-gray-100/90 dark:group-data-[role=assistant]/message:from-zinc-800/90 dark:group-data-[role=assistant]/message:to-zinc-900/90 group-data-[role=assistant]/message:text-black dark:group-data-[role=assistant]/message:text-white flex gap-4 group-data-[role=assistant]/message:px-4 w-full group-data-[role=assistant]/message:w-fit group-data-[role=assistant]/message:ml-0 group-data-[role=assistant]/message:py-3 rounded-2xl shadow-lg backdrop-blur-sm'
        )}
      >
        <div className="flex flex-col w-full">
          {message?.experimental_attachments
            ?.filter(attachment =>
              attachment?.contentType?.startsWith('image/'),
            )
            .map((attachment, index) => (
              <div 
                key={`${message.id}-${index}`} 
                className="rounded-lg overflow-hidden shadow-md mb-2 cursor-pointer hover:opacity-90 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                onClick={() => setSelectedImage(attachment.url)}
              >
                <Image
                  src={attachment.url}
                  width={500}
                  height={500}
                  alt={attachment.name ?? `attachment-${index}`}
                  className="object-cover"
                />
              </div>
            ))}

          {/* normal mcp tool result rendering */}
          {visibleRecallTracks.length <= 0 && ((message.parts || []).filter(part => part.type === 'tool-invocation').length > 0) && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {(message.parts || []).filter((part: any) => part.type === 'tool-invocation').map((part: any, index) => (
                <div key={index} className="mb-2">
                  {/* {console.log('Debug tool part:', part)} */}
                  <div className="font-semibold mb-1">Tool use result #{index + 1}</div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border">
                    <div className="markdown-body">
                    <ReactMarkdown>
                    {part.toolInvocation.toolName !== 'recall_all_tracks' ? 
                      part.toolInvocation.result?.content?.map((item: any) => item.text).join('\n\n') :
                      (() => {
                        return "No more available recall tracks";
                      })()}
                  </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* recall_all_tracks */}
          {visibleRecallTracks.length > 0 && (
            <div className="mb-4 border rounded-lg p-3 bg-gray-50 dark:bg-zinc-900">
              <div className="font-bold mb-2">Recalled Tracks</div>
              <ul className="space-y-2">
                {visibleRecallTracks.map((track: any) => (
                  <li key={track.id} className="flex items-center justify-between border-b last:border-b-0 py-1">
                    <div className="flex-1 min-w-0 max-w-xs truncate">
                      <div className="font-medium truncate">{track.name}</div>
                      <div className="text-xs text-gray-500 truncate">{track.artists?.map((a: any) => a).join(', ')}{track.album ? ` - ${track.album}` : ''}</div>
                    </div>
                    <div className="flex flex-row items-center flex-shrink-0 ml-4 w-28 justify-end">
                      <Button size="sm" variant="outline" onClick={() => handleAddTrack(track)}
                        className="hover:border-primary hover:bg-accent cursor-pointer transition-colors mr-2"
                      >
                        Add
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Discard" onClick={() => {
                        setVisibleRecallTracks(prev => {
                          const idx = prev.findIndex(t => t.id === track.id);
                          let next = prev.filter(t => t.id !== track.id);
                          if (recallQueue.length > 0) {
                            next = [...next, recallQueue[0]];
                            setRecallQueue(q => q.slice(1));
                          }
                          return next;
                        });
                      }}
                        className="hover:bg-red-100 dark:hover:bg-red-900 text-red-500"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/*  recall_all_tracks  */}
          {!isRecalling && message.content && (
            <div className="flex flex-col gap-4 text-left">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}

          {message.role === 'assistant' && (
            <MessageActions message={message} />
          )}
          </div>
        </div>
      {message.role === 'user' && (
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border ml-2 bg-gradient-to-br from-blue-400 via-indigo-400 to-violet-400 shadow-lg">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      )}
      </div>

      {/* 图片预览模态框 */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <Image
                src={selectedImage}
                width={1200}
                height={1200}
                alt="Preview"
                className="object-contain rounded-lg"
              />
              <button
                className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
                onClick={() => setSelectedImage(null)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          'group-data-[role=user]/message:bg-muted'
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>
      </div>
    </motion.div>
  );
};
