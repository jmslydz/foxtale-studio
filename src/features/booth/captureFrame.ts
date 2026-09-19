import type { Layout } from '../../types';
import { SHOT_ASPECT } from '../../lib/shotAspect';

/**
 * Center-crop aspect ratios live in src/lib/shotAspect.ts so the capture
 * preview and the saved crop can never drift apart.
 */
export const FRAME_ASPECT = SHOT_ASPECT;

/**
 * Draws the current frame of a <video> element onto a canvas, center-cropped
 * to the strip's frame aspect ratio and mirrored to match the scaleX(-1)
 * preview, then encodes it as a JPEG blob.
 */
export function captureFrame(
  video: HTMLVideoElement,
  layout: Layout | 'pose-match' | 'polaroid',
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const aspect = FRAME_ASPECT[layout];
    const videoW = video.videoWidth;
    const videoH = video.videoHeight;

    if (!videoW || !videoH) {
      reject(new Error('Video frame is not available yet'));
      return;
    }

    // Center-crop the video frame to the target aspect ratio.
    let cropW = videoW;
    let cropH = videoW / aspect;
    if (cropH > videoH) {
      cropH = videoH;
      cropW = videoH * aspect;
    }
    const cropX = (videoW - cropW) / 2;
    const cropY = (videoH - cropH) / 2;

    // Native resolution: crop dimensions straight from the video frame —
    // never downscaled. The preview <video> is mirrored with CSS, so the
    // saved photo must mirror too.
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(cropW);
    canvas.height = Math.round(cropH);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context is unavailable'));
      return;
    }
    ctx.imageSmoothingQuality = 'high';

    // Mirror horizontally so the saved photo matches the mirrored preview.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to encode captured frame'));
        }
      },
      'image/jpeg',
      0.95,
    );
  });
}
