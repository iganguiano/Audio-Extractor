import React, { useState, useRef } from 'react';
import { Upload, Music, Download, Loader2 } from 'lucide-react';

const AudioExtractor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const cleanupAudioContext = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Cleanup previous audio context and connections
    cleanupAudioContext();
    
    setFileName(file.name.replace(/\.[^/.]+$/, ''));
    setAudioUrl(null);
    
    const videoUrl = URL.createObjectURL(file);
    if (videoRef.current) {
      videoRef.current.src = videoUrl;
    }
  };

  const extractAudio = async () => {
    if (!videoRef.current) return;

    try {
      setIsProcessing(true);

      // Cleanup previous audio context and connections
      cleanupAudioContext();

      // Create new audio context and connections
      audioContextRef.current = new AudioContext();
      const mediaElement = videoRef.current;
      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(mediaElement);
      const destination = audioContextRef.current.createMediaStreamDestination();
      sourceNodeRef.current.connect(destination);

      const mediaRecorder = new MediaRecorder(destination.stream);
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsProcessing(false);
      };

      mediaRecorder.start();
      mediaElement.play();

      mediaElement.onended = () => {
        mediaRecorder.stop();
        mediaElement.pause();
      };

    } catch (error) {
      console.error('Error extracting audio:', error);
      setIsProcessing(false);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${fileName}-audio.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Cleanup on component unmount
  React.useEffect(() => {
    return () => {
      cleanupAudioContext();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Audio Extractor</h1>
            <p className="text-gray-600">Extract audio from your video files</p>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <input
                type="file"
                onChange={handleFileChange}
                accept="video/*"
                className="hidden"
                id="video-input"
              />
              <label
                htmlFor="video-input"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-gray-600">Drop your video here or click to browse</span>
                <span className="text-sm text-gray-500 mt-1">Supports most video formats</span>
              </label>
            </div>

            <video
              ref={videoRef}
              className="w-full rounded-lg bg-black"
              controls
              style={{ display: videoRef.current?.src ? 'block' : 'none' }}
            />

            {videoRef.current?.src && !audioUrl && (
              <button
                onClick={extractAudio}
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Music className="w-5 h-5" />
                    <span>Extract Audio</span>
                  </>
                )}
              </button>
            )}

            {audioUrl && (
              <div className="space-y-4">
                <audio controls className="w-full">
                  <source src={audioUrl} type="audio/mp3" />
                  Your browser does not support the audio element.
                </audio>

                <button
                  onClick={downloadAudio}
                  className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Audio</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioExtractor;
