import React from 'react';
import { motion } from 'framer-motion';
import {
  Image,
  Mic,
  MicOff,
  Send,
  Save,
  Trash2,
  X,
  FileText,
  Radio,
} from 'lucide-react';

type CaptureMode = 'text' | 'image' | 'audio';

interface CaptureDockProps {
  captureMode: CaptureMode;
  setCaptureMode: (mode: CaptureMode) => void;
  textContent: string;
  setTextContent: (content: string) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  mediaRecorder: MediaRecorder | null;
  setMediaRecorder: (recorder: MediaRecorder | null) => void;
  audioBlob: Blob | null;
  setAudioBlob: (blob: Blob | null) => void;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imagePreview: string | null;
  setImagePreview: (preview: string | null) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  handleSaveDraft: () => void;
  handleSubmit: () => void;
  isSubmitDisabled: boolean;
  isDraftDisabled: boolean;
  // Internal handlers needed by the component
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetCapture: () => void;
  startRecording: () => void;
  stopRecording: () => void;
}

export const CaptureDock: React.FC<CaptureDockProps> = ({
  captureMode,
  setCaptureMode,
  textContent,
  setTextContent,
  isRecording,
  audioBlob,
  setAudioBlob,
  imagePreview,
  setImagePreview,
  isSaving,
  fileInputRef,
  audioRef,
  handleSaveDraft,
  handleSubmit,
  isSubmitDisabled,
  isDraftDisabled,
  handleImageSelect,
  resetCapture,
  startRecording,
  stopRecording,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
      className="w-full lg:w-[350px] xl:w-[400px] h-full panel bg-[var(--color-base-panel)] border border-[var(--color-base-border)] flex flex-col overflow-hidden"
      whileHover={{ y: -2, boxShadow: '0 4px 24px rgba(74, 122, 155, 0.08)' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-base-border)]">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-8 h-8 rounded-lg bg-[var(--color-base-accent)]/15 flex items-center justify-center"
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(74, 122, 155, 0.25)' }}
            animate={{
              boxShadow: isRecording ? '0 0 12px rgba(239, 68, 68, 0.3)' : '0 0 8px rgba(74, 122, 155, 0.15)'
            }}
          >
            <Radio size={16} className={isRecording ? 'text-red-400' : 'text-[var(--color-base-accent)]'} />
          </motion.div>
          <div>
            <h1 className="text-sm font-mono tracking-[0.12em] text-[var(--color-base-text-bright)]">
              投放台
            </h1>
          </div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-[var(--color-base-border)]">
        {([
          { mode: 'text' as CaptureMode, icon: FileText, label: '文字' },
          { mode: 'image' as CaptureMode, icon: Image, label: '图片' },
          { mode: 'audio' as CaptureMode, icon: isRecording ? MicOff : Mic, label: '录音' },
        ] as const).map(({ mode, icon: Icon, label }) => (
          <motion.button
            key={mode}
            onClick={() => {
              setCaptureMode(mode);
              resetCapture();
            }}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[11px] font-mono transition-all duration-200 ${
              captureMode === mode
                ? 'bg-[var(--color-base-border-highlight)]/30 text-[var(--color-base-accent)] border-b-2 border-[var(--color-base-accent)]'
                : 'text-[var(--color-base-text)] hover:text-[var(--color-base-text-light)] hover:bg-[var(--color-base-border)]/20'
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </motion.button>
        ))}
      </div>

      {/* Input Area */}
      <div className="flex-1 p-4 flex flex-col min-h-0">
        {/* Text Input */}
        {captureMode === 'text' && (
          <motion.textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="在此输入..."
            className="flex-1 bg-[var(--color-base-bg)] border border-[var(--color-base-border)] rounded-lg p-4 text-sm text-[var(--color-base-text-light)] placeholder:text-[var(--color-base-text)] placeholder:opacity-40 resize-none focus:outline-none focus:border-[var(--color-base-accent)] font-sans leading-relaxed"
            autoFocus
            whileFocus={{ borderColor: 'var(--color-base-accent)', boxShadow: '0 0 0 3px rgba(74, 122, 155, 0.1)' }}
          />
        )}

        {/* Image Upload */}
        {captureMode === 'image' && (
          <div className="flex-1 flex flex-col min-h-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {imagePreview ? (
              <motion.div
                className="flex-1 relative group rounded-lg overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                <motion.button
                  onClick={() => {
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-[var(--color-base-bg)]/80 border border-[var(--color-base-border)] rounded-md text-[var(--color-base-text)] hover:text-[var(--color-base-text-bright)] backdrop-blur-sm transition-colors"
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.9)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={14} />
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center justify-center gap-3 bg-[var(--color-base-bg)] border-2 border-dashed border-[var(--color-base-border)] hover:border-[var(--color-base-accent)] rounded-lg text-[var(--color-base-text)] hover:text-[var(--color-base-accent)] transition-all duration-200"
                whileHover={{ y: -2, borderColor: 'var(--color-base-accent)' }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="w-12 h-12 rounded-full bg-[var(--color-base-border)]/40 flex items-center justify-center"
                  animate={{ boxShadow: ['0 0 8px rgba(74, 122, 155, 0.1)', '0 0 16px rgba(74, 122, 155, 0.2)', '0 0 8px rgba(74, 122, 155, 0.1)'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Image size={22} />
                </motion.div>
                <div className="text-center">
                  <p className="text-xs font-mono mb-1">点击上传</p>
                  <p className="text-[9px] opacity-50">JPG, PNG, GIF</p>
                </div>
              </motion.button>
            )}
          </div>
        )}

        {/* Audio Recording */}
        {captureMode === 'audio' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            {audioBlob ? (
              <div className="w-full flex flex-col items-center gap-3">
                <audio ref={audioRef} src={URL.createObjectURL(audioBlob)} controls className="w-full h-10 rounded-lg" />
                <motion.button
                  onClick={() => setAudioBlob(null)}
                  className="text-[10px] text-[var(--color-base-text)] hover:text-[var(--color-base-accent)] flex items-center gap-1.5 transition-colors"
                  whileHover={{ x: 2 }}
                >
                  <Trash2 size={11} /> 重新录制
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isRecording
                    ? 'border-red-500/60 bg-red-500/10 text-red-500'
                    : 'border-[var(--color-base-accent)]/50 bg-[var(--color-base-accent)]/5 text-[var(--color-base-accent)]'
                }`}
                animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
                transition={isRecording ? { duration: 1, repeat: Infinity } : {}}
                whileHover={!isRecording ? { y: -2, boxShadow: '0 0 20px rgba(74, 122, 155, 0.3)' } : {}}
                whileTap={{ scale: 0.98 }}
              >
                <Mic size={28} />
              </motion.button>
            )}
            <div className="text-center">
              <p className="text-xs font-mono text-[var(--color-base-text)]">
                {isRecording ? '● 录音中' : audioBlob ? '已保存' : '点击开始'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-[var(--color-base-border)] flex gap-3">
        <motion.button
          onClick={handleSaveDraft}
          disabled={isSaving || isDraftDisabled}
          className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-[var(--color-base-border)] hover:bg-[var(--color-base-border-highlight)] text-[var(--color-base-text-bright)] font-mono text-[11px] tracking-wider transition-all rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
          whileHover={!isDraftDisabled && !isSaving ? { y: -1, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : {}}
          whileTap={!isDraftDisabled && !isSaving ? { scale: 0.98 } : {}}
        >
          <Save size={13} />
          存草稿
        </motion.button>
        <motion.button
          onClick={handleSubmit}
          disabled={isSaving || isSubmitDisabled}
          className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-[var(--color-base-accent)] hover:brightness-110 text-[var(--color-base-bg)] font-mono text-[11px] tracking-wider transition-all rounded-md disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[var(--color-base-accent)]/15"
          whileHover={!isSubmitDisabled && !isSaving ? { y: -2, boxShadow: '0 4px 16px rgba(74, 122, 155, 0.3)' } : {}}
          whileTap={!isSubmitDisabled && !isSaving ? { scale: 0.98 } : {}}
        >
          <Send size={13} />
          投放
        </motion.button>
      </div>
    </motion.div>
  );
};
