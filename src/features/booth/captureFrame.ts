import type { Layout } from "../../types"
import { SHOT_ASPECT } from "../../lib/shotAspect"

/**
 * Center-crop aspect ratios live in src/lib/shotAspect.ts so the capture
 * preview and the saved crop can never drift apart.
 */
export const FRAME_ASPECT = SHOT_ASPECT

/**
 * Draws the current frame of a <video> element onto a canvas, center-cropped
 * to the strip's frame aspect ratio and mirrored (selfie lenses only) to
 * match the scaleX(-1) preview, then encodes it as a JPEG blob.
 */
export function captureFrame(
  video: HTMLVideoElement,
  layout: Layout | "pose-match" | "polaroid",
  mirrored = true,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const aspect = FRAME_ASPECT[layout]
    const videoW = video.videoWidth
    const videoH = video.videoHeight

    if (!videoW || !videoH) {
      reject(new Error("Video frame is not available yet"))
      return
    }

    // Center-crop the video frame to the target aspect ratio.
    let cropW = videoW
    let cropH = videoW / aspect
    if (cropH > videoH) {
      cropH = videoH
      cropW = videoH * aspect
    }
    const cropX = (videoW - cropW) / 2
    const cropY = (videoH - cropH) / 2
    if (
      !Number.isFinite(cropW) ||
      !Number.isFinite(cropH) ||
      cropW < 2 ||
      cropH < 2
    ) {
      reject(
        new Error(
          `bad crop ${Math.round(cropW)}x${Math.round(cropH)} from ${videoW}x${videoH}`,
        ),
      )
      return
    }

    // Native resolution: crop dimensions straight from the video frame —
    // never downscaled. The preview <video> is mirrored with CSS, so the
    // saved photo must mirror too.
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(cropW)
    canvas.height = Math.round(cropH)

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      reject(new Error("Canvas 2D context is unavailable"))
      return
    }
    ctx.imageSmoothingQuality = "high"

    // Mirror selfie lenses so the saved photo matches the mirrored preview;
    // rear/wide lenses stay as-is.
    if (mirrored) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    try {
      ctx.drawImage(
        video,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        canvas.width,
        canvas.height,
      )
    } catch (e) {
      reject(
        new Error(
          `frame grab failed (${(e as Error)?.message ?? "drawImage"})`,
        ),
      )
      return
    }

    // Encode with fallbacks: some phone browsers return null for JPEG blobs
    // (memory/format quirks) yet succeed with PNG or data URLs.
    const toBlob = (type: string, quality?: number) =>
      new Promise<Blob | null>((resolve) => {
        try {
          canvas.toBlob((b) => resolve(b), type, quality)
        } catch {
          resolve(null)
        }
      })
    ;(async () => {
      const jpeg = await toBlob("image/jpeg", 0.95)
      if (jpeg && jpeg.size > 0) return jpeg
      const png = await toBlob("image/png")
      if (png && png.size > 0) return png
      try {
        const res = await fetch(canvas.toDataURL("image/jpeg", 0.9))
        const dataBlob = await res.blob()
        if (dataBlob.size > 0) return dataBlob
      } catch {
        // fall through to the error below
      }
      throw new Error("photo encoder returned nothing")
    })().then(resolve, reject)
  })
}
