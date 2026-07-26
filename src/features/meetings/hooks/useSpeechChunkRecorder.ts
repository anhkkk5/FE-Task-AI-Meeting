"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Whisper duoc huan luyen o 16kHz mono nen day la dinh dang toi uu. */
const TARGET_SAMPLE_RATE = 16_000;
/**
 * Giu lai am thanh TRUOC thoi diem phat hien tieng noi. Day la thu giai quyet
 * loi "Xin chao" bi nghe thanh "Theo": VAD luon phat hien tre mot chut so voi
 * luc nguoi ta bat dau mo mieng.
 */
const PRE_ROLL_MS = 600;
/** Giu them mot chut sau khi im lang de khong cat cut am cuoi cau. */
const POST_ROLL_MS = 350;
/** Im lang bao lau thi coi la het cau. Nguoi Viet ngat nghi giua cum ~500-800ms. */
const SILENCE_HANGOVER_MS = 1_100;
/** Doan ngan hon nguong nay gan nhu chac chan la tieng dong. */
const MIN_UTTERANCE_MS = 900;
/** Cat cuong buc khi noi lien tuc qua lau. */
const MAX_UTTERANCE_MS = 20_000;
/** Kich thuoc bo dem vong, phai lon hon PRE_ROLL_MS. */
const RING_BUFFER_MS = 3_000;
/** Giong noi phai vuot san on nen bao nhieu lan thi moi tinh la tieng noi. */
const SPEECH_OVER_NOISE_FACTOR = 3;
/** San tuyet doi, tranh viec phong qua im khien tieng go ban cung kich hoat. */
const ABSOLUTE_RMS_FLOOR = 0.012;
/**
 * Nang luong trong dai tan giong noi phai chiem it nhat bao nhieu phan tong
 * nang luong. Tieng quat, tieng go ban, nhac nen co pho trai deu hoac lech han
 * ra ngoai dai nay nen se bi loai.
 */
const VOICE_BAND_RATIO_MIN = 0.68;
/** Dai tan chinh cua giong noi con nguoi. */
const VOICE_BAND_MIN_HZ = 85;
const VOICE_BAND_MAX_HZ = 3_400;
/**
 * Do phang pho toi da. Giong noi co cau truc hai am nen pho "go ghe" (flatness
 * thap); tieng click chuot, go ban, va dap la xung bang rong nen pho gan nhu
 * phang (flatness cao). Day la thu chan tieng click hieu qua nhat.
 */
const MAX_SPECTRAL_FLATNESS = 0.45;
/**
 * So khung lien tiep phai co giong noi thi moi bat dau ghi. Mot cu click chuot
 * hay go ban chi keo dai 5-20ms nen khong bao gio duy tri du chuoi nay, con
 * giong noi that thi luon keo dai hang tram ms.
 */
const SPEECH_ONSET_FRAMES = 3;
/**
 * Tong thoi luong THAT SU co giong noi trong mot doan. Doan chi co tieng dong
 * ngan roi im lang se khong dat nguong nay va bi bo, nen Whisper khong bao gio
 * nhan duoc dau vao rong de "doan" ra cau quang cao.
 */
const MIN_VOICED_MS = 600;

/**
 * Bat log chan doan VAD bang cach chay trong Console:
 *   localStorage.setItem("debugVad", "1")
 * roi tai lai trang. Tat bang localStorage.removeItem("debugVad").
 *
 * Log nay tra loi cau hoi "vi sao noi roi ma khong luu": neu khong thay dong
 * [vad] gui doan thi van de nam o buoc phat hien tieng noi, con neu thay gui
 * ma noi dung khong xuat hien thi van de nam o backend.
 */
function isVadDebugEnabled() {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem("debugVad") === "1";
  } catch {
    // localStorage co the bi chan boi cau hinh quyen rieng tu.
    return false;
  }
}

export type SpeechChunk = {
  audio: Blob;
  startedAt: string;
  endedAt: string;
};

type UseSpeechChunkRecorderOptions = {
  stream?: MediaStream | null;
  enabled?: boolean;
  onChunk: (chunk: SpeechChunk) => void;
};

/** Bo dem vong luu PCM da downsample ve 16kHz. */
class PcmRingBuffer {
  private readonly buffer: Float32Array;
  private writeIndex = 0;
  private filled = 0;

  constructor(capacity: number) {
    this.buffer = new Float32Array(capacity);
  }

  write(frame: Float32Array) {
    for (let index = 0; index < frame.length; index += 1) {
      this.buffer[this.writeIndex] = frame[index];
      this.writeIndex = (this.writeIndex + 1) % this.buffer.length;
    }

    this.filled = Math.min(this.filled + frame.length, this.buffer.length);
  }

  /** Lay `sampleCount` mau gan nhat theo dung thu tu thoi gian. */
  readLast(sampleCount: number) {
    const count = Math.min(sampleCount, this.filled);
    const output = new Float32Array(count);
    let readIndex =
      (this.writeIndex - count + this.buffer.length) % this.buffer.length;

    for (let index = 0; index < count; index += 1) {
      output[index] = this.buffer[readIndex];
      readIndex = (readIndex + 1) % this.buffer.length;
    }

    return output;
  }
}

function downsample(frame: Float32Array, fromRate: number, toRate: number) {
  if (fromRate <= toRate) return frame;

  const ratio = fromRate / toRate;
  const outputLength = Math.floor(frame.length / ratio);
  const output = new Float32Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    const start = Math.floor(index * ratio);
    const end = Math.min(Math.floor((index + 1) * ratio), frame.length);
    let sum = 0;

    for (let cursor = start; cursor < end; cursor += 1) {
      sum += frame[cursor];
    }

    // Lay trung binh thay vi bo mau, tranh aliasing lam meo giong noi.
    output[index] = end > start ? sum / (end - start) : 0;
  }

  return output;
}

/** Dong goi PCM thanh WAV 16-bit mono de gui len Whisper. */
export function encodeWav(samples: Float32Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeText = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(offset, clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Thu am lien tuc va tu dong cat theo tung cau noi.
 *
 * Khac biet chinh so voi cach dung MediaRecorder bat/tat theo VAD:
 * - Luon ghi vao bo dem vong nen lay duoc ca phan am thanh truoc khi phat hien
 *   tieng noi (pre-roll) -> khong mat am dau cau.
 * - Loc theo dai tan giong noi nen tieng quat, tieng go ban khong kich hoat.
 */
export function useSpeechChunkRecorder({
  stream,
  enabled = true,
  onChunk,
}: UseSpeechChunkRecorderOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState("");

  const onChunkRef = useRef(onChunk);

  // Dong bo callback moi nhat trong effect, khong gan ref khi dang render.
  useEffect(() => {
    onChunkRef.current = onChunk;
  }, [onChunk]);

  const emitChunk = useCallback(
    (samples: Float32Array, sampleRate: number, startedAtMs: number) => {
      const durationMs = (samples.length / sampleRate) * 1_000;

      if (durationMs < MIN_UTTERANCE_MS) return;

      onChunkRef.current({
        audio: encodeWav(samples, sampleRate),
        startedAt: new Date(startedAtMs).toISOString(),
        endedAt: new Date(startedAtMs + durationMs).toISOString(),
      });
    },
    [],
  );

  useEffect(() => {
    if (!enabled || !stream) return;

    const audioTracks = stream
      .getAudioTracks()
      .filter((track) => track.readyState === "live");

    if (!audioTracks.length) return;

    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextCtor) {
      setError("Trình duyệt này chưa hỗ trợ phân tích âm thanh.");
      return;
    }

    let disposed = false;
    const audioContext = new AudioContextCtor();
    const sourceRate = audioContext.sampleRate;
    const ringBuffer = new PcmRingBuffer(
      Math.ceil((RING_BUFFER_MS / 1_000) * TARGET_SAMPLE_RATE),
    );
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2_048;
    analyser.smoothingTimeConstant = 0.2;
    // Phai dung getFloatFrequencyData (tra ve dBFS) roi tu quy doi ve bien do
    // tuyen tinh. Ban truoc dung getByteFrequencyData la SAI: byte do la thang
    // dB da nen dai dong, nen spectral flatness tinh tren no luon xap xi 1 voi
    // MOI loai am thanh - ke ca giong noi that - khien khong doan nao duoc gui.
    const frequencyData = new Float32Array(analyser.frequencyBinCount);

    const source = audioContext.createMediaStreamSource(
      new MediaStream(audioTracks),
    );
    source.connect(analyser);

    // San on nen hoc dan theo moi truong that cua nguoi dung.
    let noiseFloor = ABSOLUTE_RMS_FLOOR;
    let capturing = false;
    let utteranceSamples: Float32Array[] = [];
    let utteranceStartMs = 0;
    let lastSpeechMs = 0;
    let postRollRemaining = 0;
    /** So khung lien tiep dang co giong noi, dung de loai xung ngan. */
    let voicedStreak = 0;
    /** Tong thoi luong co giong noi trong doan dang ghi. */
    let voicedMs = 0;
    const debugVad = isVadDebugEnabled();
    /** Chan log dinh ky ve 1 dong/giay de khong lut console. */
    let lastDebugLogMs = 0;

    /**
     * Do dac dac trung pho cua khung hien tai.
     * - voiceRatio: nang luong co tap trung o dai tan giong noi hay khong.
     * - flatness: pho phang (tieng dong bang rong) hay go ghe (giong noi).
     */
    const analyseSpectrum = () => {
      analyser.getFloatFrequencyData(frequencyData);
      const hzPerBin = sourceRate / 2 / frequencyData.length;
      let voiceEnergy = 0;
      let totalEnergy = 0;
      let logSum = 0;
      let linearSum = 0;
      let voiceBinCount = 0;

      for (let index = 0; index < frequencyData.length; index += 1) {
        const decibels = frequencyData[index];

        // Bin duoi san nghe duoc coi nhu khong co nang luong. -Infinity xuat
        // hien khi bin hoan toan im.
        if (!Number.isFinite(decibels) || decibels <= -100) continue;

        // dBFS -> bien do tuyen tinh. Spectral flatness chi co y nghia tren
        // mien tuyen tinh.
        const magnitude = 10 ** (decibels / 20);
        totalEnergy += magnitude;

        const frequency = index * hzPerBin;
        if (frequency >= VOICE_BAND_MIN_HZ && frequency <= VOICE_BAND_MAX_HZ) {
          voiceEnergy += magnitude;
          logSum += Math.log(magnitude);
          linearSum += magnitude;
          voiceBinCount += 1;
        }
      }

      if (!totalEnergy || !voiceBinCount) return { voiceRatio: 0, flatness: 1 };

      const geometricMean = Math.exp(logSum / voiceBinCount);
      const arithmeticMean = linearSum / voiceBinCount;

      return {
        voiceRatio: voiceEnergy / totalEnergy,
        flatness: arithmeticMean ? geometricMean / arithmeticMean : 1,
      };
    };

    const flushUtterance = () => {
      if (!utteranceSamples.length) return;

      const totalLength = utteranceSamples.reduce(
        (sum, part) => sum + part.length,
        0,
      );
      const merged = new Float32Array(totalLength);
      let offset = 0;

      for (const part of utteranceSamples) {
        merged.set(part, offset);
        offset += part.length;
      }

      const durationMs = Math.round((totalLength / TARGET_SAMPLE_RATE) * 1_000);

      // Chi gui len Whisper khi doan co du giong noi that. Neu khong, Whisper
      // se nhan mot doan gan nhu im lang va "doan" ra cau quang cao YouTube.
      if (voicedMs >= MIN_VOICED_MS) {
        if (debugVad) {
          console.info(
            `[vad] gui doan len server: dai ${durationMs}ms, co giong noi ${Math.round(voicedMs)}ms`,
          );
        }

        emitChunk(merged, TARGET_SAMPLE_RATE, utteranceStartMs);
      } else if (debugVad) {
        console.warn(
          `[vad] BO doan: chi co ${Math.round(voicedMs)}ms giong noi, can toi thieu ${MIN_VOICED_MS}ms (doan dai ${durationMs}ms)`,
        );
      }

      utteranceSamples = [];
      capturing = false;
      postRollRemaining = 0;
      voicedMs = 0;
      voicedStreak = 0;
      if (!disposed) setIsSpeaking(false);
    };

    const handleFrame = (frame: Float32Array) => {
      const downsampled = downsample(frame, sourceRate, TARGET_SAMPLE_RATE);
      ringBuffer.write(downsampled);

      let sumOfSquares = 0;
      for (let index = 0; index < downsampled.length; index += 1) {
        sumOfSquares += downsampled[index] * downsampled[index];
      }
      const rms = Math.sqrt(sumOfSquares / downsampled.length);
      const now = Date.now();
      const frameMs = (downsampled.length / TARGET_SAMPLE_RATE) * 1_000;
      const speechThreshold = Math.max(
        ABSOLUTE_RMS_FLOOR,
        noiseFloor * SPEECH_OVER_NOISE_FACTOR,
      );
      const { voiceRatio, flatness } = analyseSpectrum();
      const passedLoudness = rms >= speechThreshold;
      const passedVoiceBand = voiceRatio >= VOICE_BAND_RATIO_MIN;
      const passedFlatness = flatness <= MAX_SPECTRAL_FLATNESS;
      const isVoice = passedLoudness && passedVoiceBand && passedFlatness;

      // In dinh ky de thay ro tieu chi nao dang chan am thanh, khong in moi
      // khung vi se lut console.
      if (debugVad && now - lastDebugLogMs >= 1_000) {
        lastDebugLogMs = now;
        console.debug(
          `[vad] rms=${rms.toFixed(4)}/${speechThreshold.toFixed(4)}${passedLoudness ? "" : " QUA_NHO"}` +
            ` dai-giong-noi=${voiceRatio.toFixed(2)}/${VOICE_BAND_RATIO_MIN}${passedVoiceBand ? "" : " LECH_DAI"}` +
            ` do-phang=${flatness.toFixed(3)}/${MAX_SPECTRAL_FLATNESS}${passedFlatness ? "" : " QUA_PHANG"}` +
            ` dang-ghi=${capturing}`,
        );
      }

      if (isVoice) {
        voicedStreak += 1;

        // Xung ngan (click chuot, go ban) khong duy tri du lau de bat dau ghi.
        if (!capturing && voicedStreak < SPEECH_ONSET_FRAMES) return;

        lastSpeechMs = now;
        postRollRemaining = POST_ROLL_MS;
        voicedMs += frameMs;

        if (!capturing) {
          capturing = true;
          // Lay ca phan am thanh truoc thoi diem phat hien -> giu am dau cau.
          const preRollSamples = ringBuffer.readLast(
            Math.ceil((PRE_ROLL_MS / 1_000) * TARGET_SAMPLE_RATE),
          );
          utteranceSamples = [preRollSamples];
          utteranceStartMs = now - PRE_ROLL_MS;
          if (!disposed) setIsSpeaking(true);
          return;
        }

        utteranceSamples.push(downsampled);

        if (now - utteranceStartMs >= MAX_UTTERANCE_MS) flushUtterance();
        return;
      }

      voicedStreak = 0;
      // Cap nhat san on nen bang trung binh truot khi khong co tieng noi.
      noiseFloor = noiseFloor * 0.95 + rms * 0.05;

      if (!capturing) return;

      if (postRollRemaining > 0) {
        utteranceSamples.push(downsampled);
        postRollRemaining -= frameMs;
        return;
      }

      if (now - lastSpeechMs >= SILENCE_HANGOVER_MS) flushUtterance();
    };

    let workletNode: AudioWorkletNode | null = null;
    let processorNode: ScriptProcessorNode | null = null;
    let silentGain: GainNode | null = null;

    const startWithScriptProcessor = () => {
      // ScriptProcessorNode da deprecated nhung con chay o moi trinh duyet,
      // dung lam duong du phong khi khong nap duoc AudioWorklet.
      processorNode = audioContext.createScriptProcessor(4_096, 1, 1);
      processorNode.onaudioprocess = (event) => {
        handleFrame(new Float32Array(event.inputBuffer.getChannelData(0)));
      };
      source.connect(processorNode);
      // Phai noi vao destination de node duoc chay, gain 0 de khong vong tieng.
      silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      processorNode.connect(silentGain);
      silentGain.connect(audioContext.destination);
    };

    const start = async () => {
      try {
        await audioContext.audioWorklet.addModule(
          "/worklets/pcm-recorder.worklet.js",
        );

        if (disposed) return;

        workletNode = new AudioWorkletNode(audioContext, "pcm-recorder");
        workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
          handleFrame(event.data);
        };
        source.connect(workletNode);
      } catch {
        if (disposed) return;
        startWithScriptProcessor();
      }

      await audioContext.resume().catch(() => undefined);

      if (!disposed) {
        setIsListening(true);
        setError("");
      }
    };

    void start();

    return () => {
      disposed = true;
      flushUtterance();
      workletNode?.port.close();
      workletNode?.disconnect();
      if (processorNode) {
        processorNode.onaudioprocess = null;
        processorNode.disconnect();
      }
      silentGain?.disconnect();
      source.disconnect();
      analyser.disconnect();
      void audioContext.close().catch(() => undefined);
      setIsListening(false);
      setIsSpeaking(false);
    };
  }, [emitChunk, enabled, stream]);

  return { isListening, isSpeaking, error };
}
