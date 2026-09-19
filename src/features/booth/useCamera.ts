import { useCallback, useEffect, useRef, useState } from 'react';
import { aliveRef } from './cameraLifecycle';

export type CameraStatus = 'idle' | 'ready' | 'denied' | 'unavailable';

/**
 * Accesses the user's camera via getUserMedia and exposes a ref to attach
 * to a <video> element. All tracks are stopped on unmount.
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      // The screen can unmount while the permission prompt is open (e.g. the
      // user presses Back). Discard the stream instead of leaking it.
      if (!aliveRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        // Fire-and-forget: play() resolves only once frames arrive; the
        // status should reflect "stream acquired" immediately.
        video.play().catch(() => undefined);
      }
      setStatus('ready');
    } catch (err) {
      const name = (err as { name?: string }).name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setStatus('denied');
      } else {
        setStatus('unavailable');
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    };
  }, []);

  return { videoRef, status, start, stop };
}
