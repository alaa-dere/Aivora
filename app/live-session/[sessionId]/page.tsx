'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

export default function InAppLiveSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const sessionId = String(params.sessionId || '').trim();
  const roomName = useMemo(() => `AivoraSession_${sessionId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [sessionId]);
  const displayName = searchParams.get('name') || 'Aivora User';
  const role = searchParams.get('role') || 'student';
  const fallbackLink = searchParams.get('fallback') || '';

  useEffect(() => {
    if (!containerRef.current || !roomName) return;

    setReady(false);
    setError('');

    let api: any;
    let failSafeTimer: ReturnType<typeof setTimeout> | null = null;
    const scriptId = 'jitsi-external-api-script';

    const hasWebRtcSupport = () => {
      if (typeof window === 'undefined') return false;
      const hasRTCPeer =
        typeof (window as any).RTCPeerConnection !== 'undefined' ||
        typeof (window as any).webkitRTCPeerConnection !== 'undefined' ||
        typeof (window as any).mozRTCPeerConnection !== 'undefined';
      const hasMediaDevices =
        typeof navigator !== 'undefined' &&
        !!navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === 'function';
      return hasRTCPeer && hasMediaDevices;
    };

    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setError('Live meeting needs HTTPS to access camera and microphone.');
      return;
    }

    if (!hasWebRtcSupport()) {
      setError('WebRTC is not available in this browser. Please use Chrome or Edge.');
      return;
    }

    const startJitsi = () => {
      if (!window.JitsiMeetExternalAPI) {
        setError('Live meeting failed to load.');
        return;
      }

      api = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        userInfo: { displayName },
        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
        },
        interfaceConfigOverwrite: {
          MOBILE_APP_PROMO: false,
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
        },
      });

      api.addEventListener('videoConferenceJoined', () => {
        if (failSafeTimer) clearTimeout(failSafeTimer);
        setReady(true);
      });

      failSafeTimer = setTimeout(() => {
        setError('Could not join this room in-app. Please open Zoom fallback.');
      }, 12000);
    };

    if (window.JitsiMeetExternalAPI) {
      startJitsi();
    } else {
      const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', startJitsi, { once: true });
      } else {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = startJitsi;
        script.onerror = () => setError('Could not load meeting SDK.');
        document.body.appendChild(script);
      }
    }

    return () => {
      if (failSafeTimer) clearTimeout(failSafeTimer);
      if (api && typeof api.dispose === 'function') api.dispose();
    };
  }, [displayName, roomName]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="portal-surface rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">In-App Live Session</p>
            <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white inline-flex items-center gap-2">
              <VideoCameraIcon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              {role === 'teacher' ? 'Teacher Room' : 'Student Room'}
            </h1>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">Provider: Jitsi (In-App)</p>
          </div>
          <Link
            href={role === 'teacher' ? '/teacher/live-sessions' : '/student/calendar'}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 text-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back
          </Link>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-200">
            {error}
            {fallbackLink ? (
              <div className="mt-2">
                <a href={fallbackLink} target="_blank" rel="noreferrer" className="underline font-medium">
                  Open Zoom fallback
                </a>
              </div>
            ) : null}
          </div>
        )}

        {!ready && !error && (
          <div className="mb-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-200">
            Connecting to live room...
          </div>
        )}

        <div className="portal-surface rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden h-[70vh] min-h-[460px] bg-black">
          <div ref={containerRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}