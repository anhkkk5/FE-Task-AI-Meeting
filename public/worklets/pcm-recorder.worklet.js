/**
 * AudioWorklet thu PCM lien tuc va day tung khung ve main thread.
 *
 * Muc dich: main thread luon co du lieu am thanh trong bo dem vong, nen khi
 * phat hien co nguoi noi ta van lay duoc phan am thanh TRUOC thoi diem phat
 * hien (pre-roll). Cach cu dung MediaRecorder chi bat dau ghi sau khi phat
 * hien tieng noi nen mat 200-400ms dau moi cau.
 */
class PcmRecorderProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];

    if (!input || !input.length) return true;

    const channel = input[0];

    if (!channel || !channel.length) return true;

    // Copy vi buffer goc duoc tai su dung giua cac lan goi process().
    this.port.postMessage(new Float32Array(channel), []);

    return true;
  }
}

registerProcessor('pcm-recorder', PcmRecorderProcessor);
