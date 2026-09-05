import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export const metadata = {
  title: "注册 - Web App Store",
  description: "创建您的 Web App Store 账号",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b1e0f]" />}>
      <AuthForm initialMode="signup" />
    </Suspense>
  );
}
