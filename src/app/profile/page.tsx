"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { updateProfile, changePassword } from "@/features/users/api/users.api";
import { useAuth } from "@/hooks/useAuth";

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

export default function ProfilePage() {
  const { user, isLoading: authLoading, logoutUser, refreshUser } = useAuth(true);

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [profileMessage, setProfileMessage] = useState<Notice>({ type: "", text: "" });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<Notice>({ type: "", text: "" });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setAvatarUrl(user.avatarUrl || "");
      setPhoneNumber(user.phoneNumber || "");
      setJobTitle(user.jobTitle || "");
    }
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
      </div>
    </AppShell>
  );
}
