"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  changePassword,
  getAiUserPreferences,
  resetAiUserPreferences,
  updateAiUserPreferences,
  updateProfile,
} from "@/features/users/api/users.api";
import type {
  AiFocusArea,
  AiResponseStyle,
  AiTone,
  AiUserPreferences,
} from "@/features/users/types/user-profile.type";
import { useAuth } from "@/hooks/useAuth";
import { setMfa } from "@/features/auth/api/auth.api";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationType,
} from "@/features/notifications/api/notifications.api";

type Notice = {
  type: "" | "success" | "error";
  text: string;
};

function NoticeBox({ notice }: { notice: Notice }) {
  if (!notice.text) return null;

  return (
    <div
      className={`rounded border px-3 py-2 text-sm ${
        notice.type === "success"
          ? "border-[#abf5d1] bg-[#dcfff1] text-[#216e4e]"
          : "border-[#ffd2cc] bg-[#fff4f2] text-[#ae2a19]"
      }`}
    >
      {notice.text}
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-[#172b4d]">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "h-10 w-full rounded border border-[#dfe1e6] bg-white px-3 text-sm text-[#172b4d] outline-none transition placeholder:text-[#7a869a] hover:bg-[#f7f8f9] focus:border-[#0c66e4] focus:bg-white focus:ring-1 focus:ring-[#0c66e4]";

const defaultAiPreferences: AiUserPreferences = {
  responseStyle: "BALANCED",
  tone: "PROFESSIONAL",
  focusAreas: ["PROGRESS", "BLOCKERS", "DECISIONS", "ACTION_ITEMS"],
};

const responseStyleOptions: Array<{ value: AiResponseStyle; label: string }> = [
  { value: "CONCISE", label: "Ngắn gọn" },
  { value: "BALANCED", label: "Cân bằng" },
  { value: "DETAILED", label: "Chi tiết" },
];

const toneOptions: Array<{ value: AiTone; label: string }> = [
  { value: "PROFESSIONAL", label: "Chuyên nghiệp" },
  { value: "DIRECT", label: "Thẳng vào vấn đề" },
  { value: "SUPPORTIVE", label: "Tích cực, hỗ trợ" },
];

const focusAreaOptions: Array<{ value: AiFocusArea; label: string }> = [
  { value: "PROGRESS", label: "Tiến độ" },
  { value: "BLOCKERS", label: "Vướng mắc" },
  { value: "DEADLINES", label: "Thời hạn" },
  { value: "DECISIONS", label: "Quyết định" },
  { value: "ACTION_ITEMS", label: "Việc cần làm" },
];

const notificationOptions: Array<{ value: NotificationType; label: string }> = [
  { value: "TASK_ASSIGNED", label: "Được giao công việc" },
  { value: "TASK_MENTIONED", label: "Được nhắc đến trong bình luận" },
  { value: "TASK_DUE_SOON", label: "Công việc sắp đến hạn" },
  { value: "TASK_OVERDUE", label: "Công việc quá hạn" },
  { value: "TASK_BLOCKER_RESOLVED", label: "Công việc được gỡ chặn" },
  { value: "HANDOVER_SUBMITTED", label: "Nhận bàn giao ca" },
  { value: "HANDOVER_ACCEPTED", label: "Bàn giao được chấp nhận" },
  { value: "HANDOVER_REJECTED", label: "Bàn giao bị từ chối" },
  { value: "HANDOVER_CHANGES_REQUESTED", label: "Bàn giao cần chỉnh sửa" },
  { value: "MEETING_INVITED", label: "Được mời vào cuộc họp" },
  { value: "MEETING_UPDATED", label: "Cuộc họp thay đổi" },
  { value: "MEETING_CANCELLED", label: "Cuộc họp bị hủy" },
];

export default function ProfilePage() {
  const { user, isLoading: authLoading, logoutUser, refreshUser } = useAuth(true);

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [profileMessage, setProfileMessage] = useState<Notice>({ type: "", text: "" });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingMfa, setIsUpdatingMfa] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<Notice>({ type: "", text: "" });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [aiPreferences, setAiPreferences] = useState<AiUserPreferences>(
    defaultAiPreferences,
  );
  const [aiPreferencesMessage, setAiPreferencesMessage] = useState<Notice>({
    type: "",
    text: "",
  });
  const [isLoadingAiPreferences, setIsLoadingAiPreferences] = useState(true);
  const [isSavingAiPreferences, setIsSavingAiPreferences] = useState(false);
  const [disabledNotificationTypes, setDisabledNotificationTypes] = useState<NotificationType[]>([]);
  const [notificationMessage, setNotificationMessage] = useState<Notice>({ type: "", text: "" });
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setAvatarUrl(user.avatarUrl || "");
      setPhoneNumber(user.phoneNumber || "");
      setJobTitle(user.jobTitle || "");
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void getNotificationPreferences()
      .then((response) => {
        if (active) setDisabledNotificationTypes(response.data.disabledTypes);
      })
      .catch((error) => {
        if (active) setNotificationMessage({ type: "error", text: error instanceof Error ? error.message : "Không thể tải tùy chọn thông báo." });
      })
      .finally(() => {
        if (active) setIsLoadingNotifications(false);
      });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    void getAiUserPreferences()
      .then((response) => {
        if (active) setAiPreferences(response.data);
      })
      .catch((error) => {
        if (!active) return;
        setAiPreferencesMessage({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "Không thể tải tùy chọn trợ lý AI.",
        });
      })
      .finally(() => {
        if (active) setIsLoadingAiPreferences(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8f9]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0c66e4] border-t-transparent" />
      </div>
    );
  }

  const handleUpdateProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileMessage({ type: "", text: "" });
    setIsUpdatingProfile(true);

    try {
      if (!fullName.trim()) {
        throw new Error("Họ và tên không được để trống");
      }

      const res = await updateProfile({
        fullName: fullName.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
      });

      if (!res.success) {
        throw new Error(res.message || "Không thể cập nhật hồ sơ");
      }

      setProfileMessage({ type: "success", text: "Đã lưu thay đổi hồ sơ." });
      await refreshUser();
    } catch (error) {
      setProfileMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Cập nhật thất bại.",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordMessage({ type: "", text: "" });
    setIsChangingPassword(true);

    try {
      if (!currentPassword) {
        throw new Error("Vui lòng nhập mật khẩu hiện tại");
      }
      if (newPassword.length < 6) {
        throw new Error("Mật khẩu mới phải từ 6 ký tự trở lên");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("Xác nhận mật khẩu mới không khớp");
      }

      const res = await changePassword({ currentPassword, newPassword });

      if (!res.success) {
        throw new Error(res.message || "Đổi mật khẩu thất bại");
      }

      setPasswordMessage({
        type: "success",
        text: "Đã đổi mật khẩu. Hệ thống sẽ đăng xuất sau giây lát.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        void logoutUser();
      }, 2000);
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Đổi mật khẩu thất bại.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const userInitial = fullName ? fullName.charAt(0).toUpperCase() : "U";

  const toggleFocusArea = (focusArea: AiFocusArea) => {
    setAiPreferences((current) => {
      const isSelected = current.focusAreas.includes(focusArea);
      if (isSelected && current.focusAreas.length === 1) return current;

      return {
        ...current,
        focusAreas: isSelected
          ? current.focusAreas.filter((item) => item !== focusArea)
          : [...current.focusAreas, focusArea],
      };
    });
  };

  const handleSaveAiPreferences = async () => {
    setAiPreferencesMessage({ type: "", text: "" });
    setIsSavingAiPreferences(true);
    try {
      const response = await updateAiUserPreferences(aiPreferences);
      setAiPreferences(response.data);
      setAiPreferencesMessage({
        type: "success",
        text: "Đã lưu cách trợ lý AI hỗ trợ bạn.",
      });
    } catch (error) {
      setAiPreferencesMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Không thể lưu tùy chọn trợ lý AI.",
      });
    } finally {
      setIsSavingAiPreferences(false);
    }
  };

  const handleResetAiPreferences = async () => {
    setAiPreferencesMessage({ type: "", text: "" });
    setIsSavingAiPreferences(true);
    try {
      const response = await resetAiUserPreferences();
      setAiPreferences(response.data);
      setAiPreferencesMessage({
        type: "success",
        text: "Đã khôi phục tùy chọn mặc định.",
      });
    } catch (error) {
      setAiPreferencesMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Không thể khôi phục tùy chọn mặc định.",
      });
    } finally {
      setIsSavingAiPreferences(false);
    }
  };

  const toggleNotification = (type: NotificationType) => {
    setDisabledNotificationTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    );
  };

  const handleSaveNotificationPreferences = async () => {
    setNotificationMessage({ type: "", text: "" });
    setIsSavingNotifications(true);
    try {
      const response = await updateNotificationPreferences({ disabledTypes: disabledNotificationTypes });
      setDisabledNotificationTypes(response.data.disabledTypes);
      setNotificationMessage({ type: "success", text: "Đã lưu tùy chọn thông báo." });
    } catch (error) {
      setNotificationMessage({ type: "error", text: error instanceof Error ? error.message : "Không thể lưu tùy chọn thông báo." });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  return (
    <AppShell title="Trang cá nhân">
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="overflow-hidden rounded border border-[#dfe1e6] bg-white">
          <div className="h-28 border-b border-[#dfe1e6] bg-[#deebff]" />
          <div className="flex flex-col gap-4 px-6 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="-mt-12 flex items-end gap-4">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="h-24 w-24 rounded-full border-4 border-white object-cover"
                  onError={() => setAvatarUrl("")}
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-[#36b37e] text-4xl font-semibold text-[#172b4d]">
                  {userInitial}
                </div>
              )}
              <div className="pb-1">
                <h1 className="text-2xl font-semibold text-[#172b4d]">{fullName || "Thành viên"}</h1>
                <p className="mt-1 text-sm text-[#44546f]">{user?.email}</p>
                {jobTitle ? <p className="mt-1 text-sm text-[#6b778c]">{jobTitle}</p> : null}
              </div>
            </div>
            <div className="flex gap-2 pb-1 text-sm">
              <span className="rounded bg-[#f1f2f4] px-2 py-1 font-medium text-[#44546f]">
                Hồ sơ cá nhân
              </span>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <section className="rounded border border-[#dfe1e6] bg-white">
            <div className="border-b border-[#dfe1e6] px-5 py-4">
              <h2 className="text-lg font-semibold text-[#172b4d]">Thông tin cá nhân</h2>
              <p className="mt-1 text-sm text-[#6b778c]">
                Cập nhật thông tin cơ bản để thành viên khác nhận diện bạn trong workspace.
              </p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 px-5 py-5">
              <NoticeBox notice={profileMessage} />

              <Field label="Họ và tên" required>
                <input
                  className={inputClass}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                  type="text"
                  value={fullName}
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Chức danh / Vị trí">
                  <input
                    className={inputClass}
                    onChange={(event) => setJobTitle(event.target.value)}
                    placeholder="Software Engineer, Product Manager..."
                    type="text"
                    value={jobTitle}
                  />
                </Field>

                <Field label="Số điện thoại">
                  <input
                    className={inputClass}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="09xxxxxxxx"
                    type="text"
                    value={phoneNumber}
                  />
                </Field>
              </div>

              <Field label="Avatar URL">
                <input
                  className={inputClass}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  type="url"
                  value={avatarUrl}
                />
              </Field>

              <div className="flex justify-end border-t border-[#dfe1e6] pt-4">
                <button
                  className="h-9 rounded bg-[#0c66e4] px-4 text-sm font-semibold text-white hover:bg-[#0055cc] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isUpdatingProfile}
                  type="submit"
                >
                  {isUpdatingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
            <div className="border-t border-[#dfe1e6] px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div><p className="text-sm font-semibold text-[#172b4d]">MFA qua email</p><p className="mt-1 text-xs text-[#6b778c]">Yêu cầu mã OTP sau khi mật khẩu đúng.</p></div>
                <button className={`rounded px-3 py-2 text-sm font-semibold ${user?.mfaEnabled ? "bg-[#fff4f2] text-[#ae2a19]" : "bg-[#0c66e4] text-white"}`} disabled={isUpdatingMfa} onClick={async () => { setIsUpdatingMfa(true); try { await setMfa(!user?.mfaEnabled); await refreshUser(); } finally { setIsUpdatingMfa(false); } }} type="button">{isUpdatingMfa ? "Đang lưu..." : user?.mfaEnabled ? "Tắt MFA" : "Bật MFA"}</button>
              </div>
            </div>
          </section>

          <section className="rounded border border-[#dfe1e6] bg-white">
            <div className="border-b border-[#dfe1e6] px-5 py-4">
              <h2 className="text-lg font-semibold text-[#172b4d]">Bảo mật</h2>
              <p className="mt-1 text-sm text-[#6b778c]">Đổi mật khẩu định kỳ để bảo vệ tài khoản.</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 px-5 py-5">
              <NoticeBox notice={passwordMessage} />

              <Field label="Mật khẩu hiện tại" required>
                <input
                  className={inputClass}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                  type="password"
                  value={currentPassword}
                />
              </Field>

              <Field label="Mật khẩu mới" required>
                <input
                  className={inputClass}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  type="password"
                  value={newPassword}
                />
              </Field>

              <Field label="Xác nhận mật khẩu mới" required>
                <input
                  className={inputClass}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  type="password"
                  value={confirmPassword}
                />
              </Field>

              <div className="flex justify-end border-t border-[#dfe1e6] pt-4">
                <button
                  className="h-9 rounded bg-[#172b4d] px-4 text-sm font-semibold text-white hover:bg-[#0c1f3f] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isChangingPassword}
                  type="submit"
                >
                  {isChangingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
                </button>
              </div>
            </form>
          </section>
        </div>

        <section className="rounded border border-[#dfe1e6] bg-white">
          <div className="border-b border-[#dfe1e6] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#172b4d]">
              Trợ lý AI của bạn
            </h2>
            <p className="mt-1 text-sm text-[#6b778c]">
              Chọn cách trình bày phù hợp cho báo cáo giao ban và tóm tắt cuộc
              họp cá nhân.
            </p>
          </div>

          <div className="space-y-5 px-5 py-5">
            <NoticeBox notice={aiPreferencesMessage} />

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Mức độ chi tiết">
                <div className="grid grid-cols-3 gap-1 rounded bg-[#f1f2f4] p-1">
                  {responseStyleOptions.map((option) => (
                    <button
                      className={`h-9 rounded px-2 text-sm font-medium transition ${
                        aiPreferences.responseStyle === option.value
                          ? "bg-white text-[#0c66e4] shadow-sm"
                          : "text-[#44546f] hover:bg-[#dcdfe4]"
                      }`}
                      disabled={isLoadingAiPreferences}
                      key={option.value}
                      onClick={() =>
                        setAiPreferences((current) => ({
                          ...current,
                          responseStyle: option.value,
                        }))
                      }
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Giọng điệu">
                <select
                  className={inputClass}
                  disabled={isLoadingAiPreferences}
                  onChange={(event) =>
                    setAiPreferences((current) => ({
                      ...current,
                      tone: event.target.value as AiTone,
                    }))
                  }
                  value={aiPreferences.tone}
                >
                  {toneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-[#172b4d]">
                Nội dung cần ưu tiên
              </legend>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-3">
                {focusAreaOptions.map((option) => (
                  <label
                    className="flex cursor-pointer items-center gap-2 text-sm text-[#44546f]"
                    key={option.value}
                  >
                    <input
                      checked={aiPreferences.focusAreas.includes(option.value)}
                      className="h-4 w-4 accent-[#0c66e4]"
                      disabled={isLoadingAiPreferences}
                      onChange={() => toggleFocusArea(option.value)}
                      type="checkbox"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap justify-end gap-2 border-t border-[#dfe1e6] pt-4">
              <button
                className="h-9 rounded px-4 text-sm font-semibold text-[#44546f] hover:bg-[#f1f2f4] disabled:opacity-60"
                disabled={isLoadingAiPreferences || isSavingAiPreferences}
                onClick={() => void handleResetAiPreferences()}
                type="button"
              >
                Khôi phục mặc định
              </button>
              <button
                className="h-9 rounded bg-[#0c66e4] px-4 text-sm font-semibold text-white hover:bg-[#0055cc] disabled:opacity-60"
                disabled={isLoadingAiPreferences || isSavingAiPreferences}
                onClick={() => void handleSaveAiPreferences()}
                type="button"
              >
                {isSavingAiPreferences ? "Đang lưu..." : "Lưu tùy chọn"}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded border border-[#dfe1e6] bg-white">
          <div className="border-b border-[#dfe1e6] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#172b4d]">Thông báo</h2>
            <p className="mt-1 text-sm text-[#6b778c]">Chọn các sự kiện bạn muốn nhận trong hộp thư của ứng dụng.</p>
          </div>
          <div className="space-y-4 px-5 py-5">
            <NoticeBox notice={notificationMessage} />
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {notificationOptions.map((option) => (
                <label className="flex cursor-pointer items-center gap-3 rounded border border-[#dfe1e6] p-3 text-sm text-[#44546f] hover:bg-[#f7f8f9]" key={option.value}>
                  <input
                    checked={!disabledNotificationTypes.includes(option.value)}
                    className="h-4 w-4 accent-[#0c66e4]"
                    disabled={isLoadingNotifications || isSavingNotifications}
                    onChange={() => toggleNotification(option.value)}
                    type="checkbox"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <div className="flex justify-end border-t border-[#dfe1e6] pt-4">
              <button
                className="h-9 rounded bg-[#0c66e4] px-4 text-sm font-semibold text-white hover:bg-[#0055cc] disabled:opacity-60"
                disabled={isLoadingNotifications || isSavingNotifications}
                onClick={() => void handleSaveNotificationPreferences()}
                type="button"
              >
                {isSavingNotifications ? "Đang lưu..." : "Lưu tùy chọn thông báo"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
