import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export const metadata = {
  title: "登录 - Web App Store",
  description: "登录您的 Web App Store 账号",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b1e0f]" />}>
      <AuthForm initialMode="login" />
    </Suspense>
  );
}
