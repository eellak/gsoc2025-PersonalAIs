'use client';

import { signIn } from 'next-auth/react';
import { Button } from 'ui/button';
import { motion } from 'framer-motion';
import { MusicIcon } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#191414] via-[#1DB954]/40 to-[#191414]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-8 bg-gradient-to-br from-[#191414] via-[#1DB954]/30 to-[#191414] backdrop-blur-sm rounded-2xl shadow-xl border border-[#1DB954]/30"
      >
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="flex justify-center">
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ 
                rotate: 0,
                scale: 1,
                y: [0, -5, 0]
              }}
              transition={{ 
                rotate: { delay: 0.3, duration: 0.5 },
                scale: { delay: 0.3, duration: 0.5 },
                y: {
                  delay: 0.8,
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }
              }}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1DB954]/60 to-[#1DB954]/30 flex items-center justify-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              >
                <MusicIcon className="w-6 h-6 text-white" />
              </motion.div>
            </motion.div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome to Spotify-Client
          </h1>
          <p className="text-sm text-white">
            Sign in to your account to continue
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-4"
        >
          <Button
            variant="default"
            size="lg"
            className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => signIn('spotify', { callbackUrl: '/' })}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Continue with Spotify
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
} 