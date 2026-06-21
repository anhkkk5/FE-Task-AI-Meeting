"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile, changePassword } from "@/features/users/api/users.api";

export default function ProfilePage() {
  const { user, isLoading: authLoading, logoutUser, refreshUser } = useAuth(true);

  // Form Profile state
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Form Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load user data into form
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
          <p className="text-sm font-medium text-zinc-600">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (res.success) {
        setProfileMessage({
          type: "success",
          text: "Cập nhật thông tin cá nhân thành công!",
        });
        await refreshUser();
      } else {
        throw new Error(res.message || "Không thể cập nhật hồ sơ");
      }
    } catch (error) {
      setProfileMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Cập nhật thất bại.",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const res = await changePassword({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        setPasswordMessage({
          type: "success",
          text: "Đổi mật khẩu thành công! Bạn sẽ bị đăng xuất sau giây lát...",
        });
        
        // Reset form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // Yêu cầu logout sau 2 giây để user kịp nhìn thấy thông báo thành công
        setTimeout(() => {
          void logoutUser();
        }, 2000);
      } else {
        throw new Error(res.message || "Đổi mật khẩu thất bại");
      }
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
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Banner Welcome */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-8 rounded-3xl text-white shadow-xl">
          <div className="absolute right-0 top-0 -mt-6 -mr-6 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
          <div className="absolute left-1/3 bottom-0 w-32 h-32 rounded-full bg-emerald-500/10 blur-xl pointer-events-none"></div>
          
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-md transition-transform duration-300 group-hover:scale-105"
                  onError={() => setAvatarUrl("")}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-emerald-500 text-slate-950 font-bold text-3xl flex items-center justify-center border-4 border-white/20 shadow-md transition-transform duration-300 group-hover:scale-105">
                  {userInitial}
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">{fullName || "Thành viên"}</h1>
              <p className="text-sm text-slate-300 font-medium">{user?.email}</p>
              {jobTitle && (
                <span className="inline-block mt-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-400">
                  {jobTitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2 Form Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Thông tin cá nhân */}
          <div className="bg-white p-8 rounded-3xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Thông tin cá nhân</h2>
                <p className="text-xs font-medium text-zinc-500 mt-1">
                  Cập nhật các thông tin cơ bản về tài khoản của bạn.
                </p>
              </div>

              {profileMessage.text && (
                <div
                  className={`p-4 rounded-2xl text-xs font-semibold border ${
                    profileMessage.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                      : "bg-red-50 border-red-200 text-red-950"
                  }`}
                >
                  {profileMessage.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 block">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 block">Chức danh / Vị trí</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Software Engineer, Product Manager..."
                    className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 block">Số điện thoại</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="09xxxxxxxx"
                    className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 block">Avatar URL</label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-bold text-white shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdatingProfile ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <span>Lưu thay đổi</span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Bảo mật & Đổi mật khẩu */}
          <div className="bg-white p-8 rounded-3xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Bảo mật & Đổi mật khẩu</h2>
                <p className="text-xs font-medium text-zinc-500 mt-1">
                  Đổi mật khẩu định kỳ để bảo vệ tài khoản của bạn.
                </p>
              </div>

              {passwordMessage.text && (
                <div
                  className={`p-4 rounded-2xl text-xs font-semibold border ${
                    passwordMessage.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                      : "bg-red-50 border-red-200 text-red-950"
                  }`}
                >
                  {passwordMessage.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 block">Mật khẩu hiện tại *</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 block">Mật khẩu mới *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 block">Xác nhận mật khẩu mới *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-bold text-white shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isChangingPassword ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <span>Đổi mật khẩu</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
