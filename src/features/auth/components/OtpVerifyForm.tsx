"use client";

import {
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowRight, Loader2, MailCheck, RotateCcw } from "lucide-react";
import {
  resendRegistrationOtp,
  verifyRegistrationOtp,
} from "@/features/auth/api/auth.api";

const OTP_LENGTH = 6;

type OtpVerifyFormProps = {
  email: string;
  /** Số giây còn phải chờ trước khi được xin mã mới, lấy từ phản hồi của bước 1. */
  initialResendSeconds: number;
  /** Gọi khi xác thực thành công, kèm accessToken để tạo phiên. */
  onVerified: (accessToken: string) => void;
  /** Cho người dùng quay lại sửa email nếu nhập sai địa chỉ. */
  onChangeEmail: () => void;
};

/**
 * Form nhập OTP 6 chữ số.
 *
 * Các chi tiết về trải nghiệm được xử lý ở đây vì đó là chỗ hay gây khó chịu
 * nhất khi nhập OTP:
 * - Dán cả mã 6 số vào bất kỳ ô nào cũng tự điền hết các ô.
 * - Tự chuyển ô khi nhập, Backspace ở ô trống thì lùi về ô trước.
 * - Đủ 6 số thì tự gửi, không cần bấm thêm.
 */
export function OtpVerifyForm({
  email,
  initialResendSeconds,
  onVerified,
  onChangeEmail,
}: OtpVerifyFormProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendIn, setResendIn] = useState(initialResendSeconds);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const submittedCodeRef = useRef("");

  const code = useMemo(() => digits.join(""), [digits]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendIn <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendIn((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendIn]);

  // Tự gửi khi đủ 6 số. Dùng ref để một mã chỉ tự gửi một lần, tránh gửi lại
  // liên tục khi người dùng sửa rồi nhập lại đúng mã cũ.
  useEffect(() => {
    if (code.length !== OTP_LENGTH || isSubmitting) {
      return;
    }

    if (submittedCodeRef.current === code) {
      return;
    }

    submittedCodeRef.current = code;
    void submitOtp(code);
  }, [code, isSubmitting]);

  async function submitOtp(otp: string) {
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await verifyRegistrationOtp({ email, otp });
      const accessToken = response.data.tokens.accessToken;

      if (!accessToken) {
        throw new Error("Xác thực thành công nhưng chưa nhận được phiên làm việc.");
      }

      onVerified(accessToken);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Xác thực thất bại. Vui lòng thử lại.",
      );
      setDigits(Array(OTP_LENGTH).fill(""));
      submittedCodeRef.current = "";
      inputsRef.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendIn > 0 || isResending) {
      return;
    }

    setIsResending(true);
    setMessage("");

    try {
      const response = await resendRegistrationOtp(email);
      setResendIn(response.data.resendAfterSeconds);
      setDigits(Array(OTP_LENGTH).fill(""));
      submittedCodeRef.current = "";
      setMessage("Đã gửi mã mới. Vui lòng kiểm tra email.");
      inputsRef.current[0]?.focus();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không gửi lại được mã.",
      );
    } finally {
      setIsResending(false);
    }
  }

  function handleChange(index: number, value: string) {
    const onlyDigits = value.replace(/\D/g, "");

    if (!onlyDigits) {
      setDigits((current) => {
        const next = [...current];
        next[index] = "";
        return next;
      });
      return;
    }

    setDigits((current) => {
      const next = [...current];
      // Người dùng gõ nhanh nhiều số vào một ô thì trải đều sang các ô sau.
      for (let offset = 0; offset < onlyDigits.length; offset += 1) {
        const target = index + offset;
        if (target < OTP_LENGTH) {
          next[target] = onlyDigits[offset];
        }
      }
      return next;
    });

    const nextIndex = Math.min(index + onlyDigits.length, OTP_LENGTH - 1);
    inputsRef.current[nextIndex]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
      setDigits((current) => {
        const next = [...current];
        next[index - 1] = "";
        return next;
      });
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) {
      return;
    }

    event.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    for (let index = 0; index < pasted.length; index += 1) {
      next[index] = pasted[index];
    }
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (code.length !== OTP_LENGTH) {
      setMessage("Vui lòng nhập đủ 6 chữ số.");
      return;
    }

    void submitOtp(code);
  }

  return (
    <div>
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/80 p-3.5">
        <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <p className="text-xs leading-relaxed text-slate-600">
          Chúng tôi đã gửi mã xác thực 6 chữ số tới{" "}
          <span className="font-bold text-slate-800">{email}</span>. Mã có hiệu
          lực trong 10 phút.
        </p>
      </div>

      {message ? (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/90 p-3 text-xs text-amber-800">
          <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
          <span className="font-medium leading-relaxed">{message}</span>
        </div>
      ) : null}

      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <fieldset>
          <legend className="mb-2 block text-xs font-semibold text-slate-700">
            Mã xác thực
          </legend>
          <div className="flex items-center justify-between gap-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                id={`otp-digit-${index}`}
                ref={(element) => {
                  inputsRef.current[index] = element;
                }}
                className="h-12 w-full max-w-12 rounded-xl border border-slate-200 bg-slate-50/50 text-center text-lg font-bold text-slate-800 outline-none transition duration-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={OTP_LENGTH}
                value={digit}
                disabled={isSubmitting}
                aria-label={`Chữ số thứ ${index + 1} của mã xác thực`}
                onChange={(event) => handleChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={handlePaste}
              />
            ))}
          </div>
        </fieldset>

        <button
          id="otp-verify-submit"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang xác thực...</span>
            </>
          ) : (
            <>
              <span>Xác thực và tạo tài khoản</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
          <button
            id="otp-change-email"
            type="button"
            className="font-bold text-slate-600 transition hover:text-slate-900 hover:underline"
            onClick={onChangeEmail}
          >
            Đổi email khác
          </button>

          <button
            id="otp-resend"
            type="button"
            className="flex items-center gap-1.5 font-bold text-blue-600 transition hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
            disabled={resendIn > 0 || isResending}
            onClick={handleResend}
          >
            {isResending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RotateCcw className="h-3 w-3" />
            )}
            <span>
              {resendIn > 0 ? `Gửi lại sau ${resendIn}s` : "Gửi lại mã"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
