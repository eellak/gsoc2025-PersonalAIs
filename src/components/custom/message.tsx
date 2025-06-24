import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cx } from 'classix';
import { SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { message } from "@/interfaces/interfaces"
import { MessageActions } from '@/components/custom/actions';
import Image from 'next/image';

export const PreviewMessage = ({ message }: { message: message; }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
          {message.content && (
            <div className="flex flex-col gap-4 text-left">
              <Markdown>{message.content}</Markdown>
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
