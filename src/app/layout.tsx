import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/features/auth/components/AuthProvider";
import { AppDialogProvider } from "@/components/feedback/AppDialogProvider";
import "./globals.css";

// Inter có tỷ lệ chữ trung tính, dễ đọc và gần trải nghiệm hội thoại của ChatGPT.
const appSans = Inter({
  variable: "--font-app-sans",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const appMono = JetBrains_Mono({
  variable: "--font-app-mono",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quản lý dự án Agile bằng AI",
  description:
    "Nền tảng quản lý workspace, dự án, cuộc họp và báo cáo giao ban tự động bằng AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${appSans.variable} ${appMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col font-sans"
        suppressHydrationWarning
      >
        {/*
         * AuthProvider dat o day de khong bi unmount khi doi route: phien dang
         * nhap chi duoc kiem tra mot lan cho ca session thay vi moi trang mot lan.
         */}
        <AuthProvider>
          <AppDialogProvider>{children}</AppDialogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
