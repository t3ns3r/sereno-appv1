import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MicrophoneIcon, 
  StopIcon, 
  PlayIcon, 
  PauseIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';
import SeniorButton from '../UI/SeniorButton';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, transcript?: string) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  maxDuration?: number; // in seconds
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  maxDuration = 120, // 2 minutes default
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Check microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      setHasPermission(false);
      setError('No se pudo acceder al micrófono. Verifica los permisos.');
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      await checkMicrophonePermission();
      if (!hasPermission) return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        onRecordingComplete(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);
      setError(null);
      
      if (onRecordingStart) {
        onRecordingStart();
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

    } catch (err) {
      setError('Error al iniciar la grabación. Verifica los permisos del micrófono.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (onRecordingStop) {
        onRecordingStop();
      }
    }
  };

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === false) {
    return (
      <div className="text-center p-6 bg-yellow-50 rounded-senior border border-yellow-200">
        <MicrophoneIcon className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Permisos de micrófono requeridos
        </h3>
        <p className="text-gray-600 mb-4">
          Para grabar tu voz, necesitamos acceso al micrófono.
        </p>
        <SeniorButton
          variant="primary"
          onClick={checkMicrophonePermission}
        >
          Permitir acceso
        </SeniorButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-senior">
          {error}
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex flex-col items-center space-y-4">
        {/* Recording Button */}
        <motion.div
          animate={isRecording ? {
            scale: [1, 1.05, 1],
            transition: { duration: 1, repeat: Infinity }
          } : {}}
        >
          {!isRecording ? (
            <SeniorButton
              variant="primary"
              size="large"
              onClick={startRecording}
              disabled={disabled}
              icon={<MicrophoneIcon className="w-6 h-6" />}
            >
              Grabar mi voz
            </SeniorButton>
          ) : (
            <SeniorButton
              variant="emergency"
              size="large"
              onClick={stopRecording}
              icon={<StopIcon className="w-6 h-6" />}
            >
              Detener grabación
            </SeniorButton>
          )}
        </motion.div>

        {/* Recording Timer */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-2 text-lg font-mono"
            >
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-gray-700">
                {formatTime(recordingTime)} / {formatTime(maxDuration)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playback Controls */}
        <AnimatePresence>
          {audioUrl && !isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center space-x-3"
            >
              <SeniorButton
                variant="secondary"
                onClick={isPlaying ? pauseRecording : playRecording}
                icon={isPlaying ? 
                  <PauseIcon className="w-5 h-5" /> : 
                  <PlayIcon className="w-5 h-5" />
                }
              >
                {isPlaying ? 'Pausar' : 'Reproducir'}
              </SeniorButton>
              
              <SeniorButton
                variant="outline"
                onClick={deleteRecording}
                icon={<TrashIcon className="w-5 h-5" />}
              >
                Borrar
              </SeniorButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* Instructions */}
      {!audioUrl && !isRecording && (
        <div className="text-center text-sm text-gray-600 bg-gray-50 p-4 rounded-senior">
          <p className="mb-2">
            💡 <strong>Consejo:</strong> Habla con naturalidad sobre cómo te sientes.
          </p>
          <p>
            Puedes describir tus emociones, lo que te preocupa, o simplemente cómo ha sido tu día.
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;