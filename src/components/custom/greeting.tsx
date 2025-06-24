import { motion } from 'framer-motion';
import { MusicIcon, Sparkles } from 'lucide-react';

export default function Greeting() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <motion.div 
          className="flex items-center justify-center mb-6"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-400 via-emerald-400 to-lime-300 flex items-center justify-center shadow-lg">
              <MusicIcon className="w-8 h-8 text-white" />
            </div>
            <motion.div 
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Sparkles className="w-3 h-3 text-white" />
            </motion.div>
          </div>
        </motion.div>
        <motion.h1 
          className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-400 via-emerald-400 to-lime-300 bg-clip-text text-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Welcome to Spotify-Client
        </motion.h1>
        <motion.p 
          className="text-muted-foreground text-lg leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          I'm your music assistant, here to help you discover music, create playlists, and more.
        </motion.p>
      </motion.div>
    </div>
  );
} 