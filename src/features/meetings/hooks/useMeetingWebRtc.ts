"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getStoredAccessToken } from "@/features/auth/utils/token-storage";
import { API_BASE_URL } from "@/lib/api/client";

type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
};

export type MeetingPeer = {
  socketId: string;
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  joinedAt: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  stream?: MediaStream;
};

type MeetingJoinedEvent = {
  meetingId: string;
  self: MeetingPeer;
  participants: MeetingPeer[];
};

type SignalDescriptionEvent = {
  fromSocketId: string;
  fromUserId?: string;
  fromFullName?: string;
  description: RTCSessionDescriptionInit;
};

type SignalCandidateEvent = {
  fromSocketId: string;
  candidate: RTCIceCandidateInit;
};

type UseMeetingWebRtcParams = {
  workspaceId: string;
  projectId: string;
  meetingId: string;
  user: CurrentUser | null;
  enabled?: boolean;
};

const iceServers: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

function getSocketBaseUrl() {
  if (process.env.NEXT_PUBLIC_SOCKET_BASE_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_BASE_URL;
  }

  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "http://localhost:3001";
  }
}

export function useMeetingWebRtc({
  workspaceId,
  projectId,
  meetingId,
  user,
  enabled = true,
}: UseMeetingWebRtcParams) {
  const socketUrl = useMemo(() => `${getSocketBaseUrl()}/meetings`, []);
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remotePeersRef = useRef<Map<string, MeetingPeer>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<MeetingPeer[]>([]);
  const [selfPeer, setSelfPeer] = useState<MeetingPeer | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [error, setError] = useState("");

  const syncRemotePeers = useCallback(() => {
    setRemotePeers([...remotePeersRef.current.values()]);
  }, []);

  const upsertRemotePeer = useCallback(
    (peer: Partial<MeetingPeer> & { socketId: string }) => {
      const current = remotePeersRef.current.get(peer.socketId);
      remotePeersRef.current.set(peer.socketId, {
        socketId: peer.socketId,
        userId: peer.userId ?? current?.userId ?? "",
        email: peer.email ?? current?.email ?? "",
        fullName: peer.fullName ?? current?.fullName ?? "Participant",
        avatarUrl: peer.avatarUrl ?? current?.avatarUrl ?? null,
        joinedAt: peer.joinedAt ?? current?.joinedAt ?? new Date().toISOString(),
        audioEnabled: peer.audioEnabled ?? current?.audioEnabled ?? true,
        videoEnabled: peer.videoEnabled ?? current?.videoEnabled ?? true,
        screenSharing: peer.screenSharing ?? current?.screenSharing ?? false,
        stream: peer.stream ?? current?.stream,
      });
      syncRemotePeers();
    },
    [syncRemotePeers],
  );

  const emitMediaState = useCallback(
    (nextState?: Partial<MeetingPeer>) => {
      socketRef.current?.emit("media-state", {
        audioEnabled:
          typeof nextState?.audioEnabled === "boolean"
            ? nextState.audioEnabled
            : audioEnabled,
        videoEnabled:
          typeof nextState?.videoEnabled === "boolean"
            ? nextState.videoEnabled
            : videoEnabled,
        screenSharing:
          typeof nextState?.screenSharing === "boolean"
            ? nextState.screenSharing
            : screenSharing,
      });
    },
    [audioEnabled, screenSharing, videoEnabled],
  );

  const attachLocalTracks = useCallback((connection: RTCPeerConnection) => {
    const stream = localStreamRef.current;

    if (!stream) {
      return;
    }

    const senderKinds = new Set(
      connection
        .getSenders()
        .map((sender) => sender.track?.kind)
        .filter(Boolean),
    );

    stream.getTracks().forEach((track) => {
      if (!senderKinds.has(track.kind)) {
        connection.addTrack(track, stream);
      }
    });
  }, []);

  const createPeerConnection = useCallback(
    (socketId: string) => {
      const existingConnection = peersRef.current.get(socketId);

      if (existingConnection) {
        return existingConnection;
      }

      const connection = new RTCPeerConnection({ iceServers });
      peersRef.current.set(socketId, connection);
      attachLocalTracks(connection);

      connection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit("webrtc-ice-candidate", {
            toSocketId: socketId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      connection.ontrack = (event) => {
        const [stream] = event.streams;

        if (stream) {
          upsertRemotePeer({
            socketId,
            stream,
          });
        }
      };

      connection.onconnectionstatechange = () => {
        if (
          ["closed", "disconnected", "failed"].includes(
            connection.connectionState,
          )
        ) {
          peersRef.current.delete(socketId);
        }
      };

      return connection;
    },
    [attachLocalTracks, upsertRemotePeer],
  );

  const createAndSendOffer = useCallback(
    async (socketId: string) => {
      const connection = createPeerConnection(socketId);
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);

      socketRef.current?.emit("webrtc-offer", {
        toSocketId: socketId,
        description: connection.localDescription,
      });
    },
    [createPeerConnection],
  );

  const startLocalMedia = useCallback(async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Trinh duyet khong ho tro camera/microphone.");
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      localStreamRef.current = stream;
      cameraVideoTrackRef.current = stream.getVideoTracks()[0] ?? null;
      setLocalStream(stream);
      setAudioEnabled(stream.getAudioTracks().some((track) => track.enabled));
      setVideoEnabled(stream.getVideoTracks().some((track) => track.enabled));

      peersRef.current.forEach((connection) => attachLocalTracks(connection));
      return stream;
    } catch {
      setAudioEnabled(false);
      setVideoEnabled(false);
      setError("Chua cap quyen camera/microphone, ban van co the vao phong.");
      return null;
    }
  }, [attachLocalTracks]);

  const closePeer = useCallback((socketId: string) => {
    peersRef.current.get(socketId)?.close();
    peersRef.current.delete(socketId);
    remotePeersRef.current.delete(socketId);
    syncRemotePeers();
  }, [syncRemotePeers]);

  const cleanup = useCallback(() => {
    socketRef.current?.emit("leave-meeting");
    socketRef.current?.disconnect();
    socketRef.current = null;

    peersRef.current.forEach((connection) => connection.close());
    peersRef.current.clear();
    remotePeersRef.current.clear();

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    cameraVideoTrackRef.current = null;

    setLocalStream(null);
    setRemotePeers([]);
    setSelfPeer(null);
    setIsConnected(false);
    setIsConnecting(false);
    setScreenSharing(false);
  }, []);

  useEffect(() => {
    if (!enabled || !user || !workspaceId || !projectId || !meetingId) {
      return undefined;
    }

    let cancelled = false;

    async function connect() {
      setIsConnecting(true);
      setError("");
      await startLocalMedia();

      if (cancelled) {
        return;
      }

      const token = getStoredAccessToken();
      const socket = io(socketUrl, {
        auth: { token },
        transports: ["websocket"],
        withCredentials: true,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setIsConnected(true);
        setIsConnecting(false);
        socket.emit("join-meeting", {
          workspaceId,
          projectId,
          meetingId,
        });
      });

      socket.on("connect_error", (connectError) => {
        setIsConnected(false);
        setIsConnecting(false);
        setError(connectError.message || "Khong ket noi duoc signaling server.");
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      socket.on("meeting-error", (payload: { message?: string }) => {
        setError(payload.message || "Loi phong hop.");
      });

      socket.on("meeting-joined", (payload: MeetingJoinedEvent) => {
        setSelfPeer(payload.self);
        payload.participants.forEach((participant) => {
          upsertRemotePeer(participant);
        });
      });

      socket.on("participant-joined", (participant: MeetingPeer) => {
        upsertRemotePeer(participant);
        void createAndSendOffer(participant.socketId);
      });

      socket.on("participant-left", (payload: { socketId: string }) => {
        closePeer(payload.socketId);
      });

      socket.on("participant-media-state", (participant: MeetingPeer) => {
        upsertRemotePeer(participant);
      });

      socket.on("webrtc-offer", async (payload: SignalDescriptionEvent) => {
        const connection = createPeerConnection(payload.fromSocketId);
        await connection.setRemoteDescription(
          new RTCSessionDescription(payload.description),
        );
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        socket.emit("webrtc-answer", {
          toSocketId: payload.fromSocketId,
          description: connection.localDescription,
        });
      });

      socket.on("webrtc-answer", async (payload: SignalDescriptionEvent) => {
        const connection = peersRef.current.get(payload.fromSocketId);

        if (connection && !connection.currentRemoteDescription) {
          await connection.setRemoteDescription(
            new RTCSessionDescription(payload.description),
          );
        }
      });

      socket.on("webrtc-ice-candidate", async (payload: SignalCandidateEvent) => {
        const connection = createPeerConnection(payload.fromSocketId);

        try {
          await connection.addIceCandidate(
            new RTCIceCandidate(payload.candidate),
          );
        } catch (candidateError) {
          console.warn("Add ICE candidate failed:", candidateError);
        }
      });
    }

    void connect();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [
    cleanup,
    closePeer,
    createAndSendOffer,
    createPeerConnection,
    enabled,
    meetingId,
    projectId,
    socketUrl,
    startLocalMedia,
    upsertRemotePeer,
    user,
    workspaceId,
  ]);

  const toggleAudio = useCallback(async () => {
    const stream = await startLocalMedia();
    const nextValue = !audioEnabled;

    stream?.getAudioTracks().forEach((track) => {
      track.enabled = nextValue;
    });

    setAudioEnabled(nextValue);
    emitMediaState({ audioEnabled: nextValue });
  }, [audioEnabled, emitMediaState, startLocalMedia]);

  const toggleVideo = useCallback(async () => {
    const stream = await startLocalMedia();
    const nextValue = !videoEnabled;

    stream?.getVideoTracks().forEach((track) => {
      track.enabled = nextValue;
    });

    setVideoEnabled(nextValue);
    emitMediaState({ videoEnabled: nextValue });
  }, [emitMediaState, startLocalMedia, videoEnabled]);

  const stopScreenShare = useCallback(async () => {
    const stream = localStreamRef.current;
    const cameraTrack = cameraVideoTrackRef.current;

    if (!stream || !cameraTrack) {
      return;
    }

    stream.getVideoTracks().forEach((track) => {
      if (track !== cameraTrack) {
        track.stop();
        stream.removeTrack(track);
      }
    });

    if (!stream.getVideoTracks().includes(cameraTrack)) {
      stream.addTrack(cameraTrack);
    }

    peersRef.current.forEach((connection) => {
      const sender = connection
        .getSenders()
        .find((item) => item.track?.kind === "video");
      void sender?.replaceTrack(cameraTrack);
    });

    setLocalStream(new MediaStream(stream.getTracks()));
    setScreenSharing(false);
    emitMediaState({ screenSharing: false, videoEnabled });
  }, [emitMediaState, videoEnabled]);

  const startScreenShare = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError("Trinh duyet khong ho tro chia se man hinh.");
      return;
    }

    const stream = await startLocalMedia();

    if (!stream) {
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const screenTrack = screenStream.getVideoTracks()[0];

      if (!screenTrack) {
        return;
      }

      peersRef.current.forEach((connection) => {
        const sender = connection
          .getSenders()
          .find((item) => item.track?.kind === "video");
        void sender?.replaceTrack(screenTrack);
      });

      stream.getVideoTracks().forEach((track) => stream.removeTrack(track));
      stream.addTrack(screenTrack);
      screenTrack.onended = () => {
        void stopScreenShare();
      };

      setLocalStream(new MediaStream(stream.getTracks()));
      setScreenSharing(true);
      emitMediaState({ screenSharing: true, videoEnabled: true });
    } catch {
      setError("Da huy chia se man hinh.");
    }
  }, [emitMediaState, startLocalMedia, stopScreenShare]);

  const leaveMeeting = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
    localStream,
    remotePeers,
    selfPeer,
    isConnecting,
    isConnected,
    audioEnabled,
    videoEnabled,
    screenSharing,
    error,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    leaveMeeting,
  };
}
