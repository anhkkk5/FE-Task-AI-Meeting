import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/features/auth/components/AuthProvider";
import { AppDialogProvider } from "@/components/feedback/AppDialogProvider";
import "./globals.css";

// Plus Jakarta Sans mang nét chữ tròn trịa, hiện đại, nét sắc và cực kỳ sáng sủa cho dashboard.
const appSans = Plus_Jakarta_Sans({
  variable: "--font-app-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
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
