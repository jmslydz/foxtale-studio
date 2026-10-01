import { useCallback, useEffect, useRef, useState } from "react"
import { aliveRef } from "./cameraLifecycle"

export type CameraStatus = "idle" | "ready" | "denied" | "unavailable"

/**
 * Accesses the user's camera via getUserMedia and exposes a ref to attach
 * to a <video> element. All tracks are stopped on unmount.
 *
 * Multi-lens phones (e.g. iPhone front / wide / ultra-wide) expose several
 * video inputs: after permission is granted the device list is enumerated
 * and `cycleCamera` hops between them. `mirrored` is true only for
 * user-facing lenses, so the rear camera isn't flipped like a mirror.
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>("idle")
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [mirrored, setMirrored] = useState(true)
  // Optical/digital zoom (iOS 17+, Android): null when the lens lacks it.
  const [zoomRange, setZoomRange] = useState<{
    min: number
    max: number
    step: number
  } | null>(null)
  const [zoom, setZoom] = useState(1)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStatus("idle")
  }, [])

  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      setDevices(all.filter((d) => d.kind === "videoinput"))
    } catch {
      // Device list is a nice-to-have; the stream already works.
    }
  }, [])

  const attach = useCallback(
    (stream: MediaStream) => {
      streamRef.current = stream
      // The screen can unmount while the permission prompt is open (e.g. the
      // user presses Back). Discard the stream instead of leaking it.
      if (!aliveRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      const track = stream.getVideoTracks()[0]
      const settings = track?.getSettings()
      if (settings?.deviceId) setDeviceId(settings.deviceId)
      const facing = settings?.facingMode ?? guessFacing(track?.label ?? "")
      setMirrored(facing !== "environment")
      // Zoom support varies by lens (front lenses often lack it).
      try {
        const caps = track?.getCapabilities?.()
        const z =
          caps && "zoom" in caps
            ? (caps as { zoom?: { min: number max: number step: number } }).zoom
            : undefined
        if (
          z &&
          Number.isFinite(z.min) &&
          Number.isFinite(z.max) &&
          z.max > z.min
        ) {
          setZoomRange({
            min: z.min,
            max: z.max,
            step: z.step > 0 ? z.step : (z.max - z.min) / 10,
          })
          setZoom(settings?.zoom ?? z.min)
        } else {
          setZoomRange(null)
          setZoom(1)
        }
      } catch {
        setZoomRange(null)
        setZoom(1)
      }
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        // Fire-and-forget: play() resolves only once frames arrive; the
        // status should reflect "stream acquired" immediately.
        video.play().catch(() => undefined)
      }
      setStatus("ready")
      void refreshDevices()
    },
    [refreshDevices],
  )

  const start = useCallback(
    async (deviceIdOrFacing?: string) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unavailable")
        return
      }
      try {
        stop()
        const video: MediaTrackConstraints = deviceIdOrFacing
          ? deviceIdOrFacing === "user" || deviceIdOrFacing === "environment"
            ? { facingMode: deviceIdOrFacing }
            : { deviceId: { exact: deviceIdOrFacing } }
          : { facingMode: "user" }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { ...video, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        attach(stream)
      } catch (err) {
        const name = (err as { name?: string }).name
        if (name === "NotAllowedError" || name === "SecurityError") {
          setStatus("denied")
        } else {
          setStatus("unavailable")
        }
      }
    },
    [attach, stop],
  )

  /** Hop to the next camera (front -> wide -> ultra-wide -> ...). */
  const cycleCamera = useCallback(() => {
    if (devices.length === 0) {
      // Labels/ids unavailable — flip the facing hint and hope.
      void start(mirrored ? "environment" : "user")
      return
    }
    const idx = devices.findIndex((d) => d.deviceId === deviceId)
    const next = devices[(idx + 1) % devices.length]
    void start(next.deviceId)
  }, [devices, deviceId, mirrored, start])

  /** Zoom the live lens (zoom out = fit more people in). No-op when unsupported. */
  const setZoomLevel = useCallback(
    (value: number) => {
      const track = streamRef.current?.getVideoTracks()[0]
      if (!track || !zoomRange) return
      const clamped = Math.min(zoomRange.max, Math.max(zoomRange.min, value))
      track
        .applyConstraints({
          advanced: [{ zoom: clamped } as MediaTrackConstraints],
        })
        .then(() => setZoom(track.getSettings().zoom ?? clamped))
        .catch(() => {
          const fallback = track.getSettings().zoom
          if (fallback !== undefined) setZoom(fallback)
        })
    },
    [zoomRange],
  )

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  return {
    videoRef,
    status,
    start,
    stop,
    devices,
    deviceId,
    mirrored,
    cycleCamera,
    zoomRange,
    zoom,
    setZoomLevel,
  }
}

/** Facing guess from a device label (empty before permission on most browsers). */
function guessFacing(label: string): "user" | "environment" | undefined {
  const l = label.toLowerCase()
  if (/front|user|facetime/.test(l)) return "user"
  if (/back|rear|environment|wide|tele|ultra/.test(l)) return "environment"
  return undefined
}
