"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Mail,
  Eye,
  EyeOff,
  User,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface AuthFormProps {
  initialMode?: "login" | "signup";
}

export function AuthForm({ initialMode = "login" }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Email & Password submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError("请填写邮箱和密码");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setError("请填写姓名或昵称");
      return;
    }

    if (password.length < 6) {
      setError("密码长度至少为 6 个字符");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const res = await authClient.signIn.email({
          email: email.trim(),
          password,
          rememberMe,
        });

        if (res?.error) {
          setError(res.error.message || "登录失败，请检查账号密码");
          setLoading(false);
          return;
        }

        setSuccess("登录成功！正在跳转...");
        setTimeout(() => {
          router.push(redirectUrl);
          router.refresh();
        }, 500);
      } else {
        const res = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim(),
        });

        if (res?.error) {
          setError(res.error.message || "注册失败，该邮箱可能已被注册");
          setLoading(false);
          return;
        }

        setSuccess("注册成功！正在进入应用...");
        setTimeout(() => {
          router.push(redirectUrl);
          router.refresh();
        }, 500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "发生错误，请稍后重试";
      setError(msg);
      setLoading(false);
    }
  };

  // Social Login: Google / GitHub
  const handleSocialLogin = async (provider: "google" | "github") => {
    setError(null);
    setSocialLoading(provider);

    try {
      await authClient.signIn.social({
        provider,
        callbackURL: redirectUrl,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : `${provider === "google" ? "Google" : "GitHub"} 登录失败，请检查配置`;
      setError(msg);
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b1e0f] flex items-center justify-center p-3 sm:p-6 md:p-8 relative selection:bg-[#f97316] selection:text-white">
      {/* Return Home Floating Link */}
      <Link
        href="/"
        className="absolute top-3 left-3 sm:top-6 sm:left-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md text-white text-xs font-medium transition border border-white/15 shadow-sm"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>返回首页</span>
      </Link>

      {/* Main Container Card */}
      <div className="w-full max-w-[1040px] bg-white rounded-2xl sm:rounded-[36px] shadow-[0_25px_70px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row border border-white/20 transition-all duration-300">
        {/* Left Column: Form Content */}
        <div className="w-full md:w-1/2 p-5 sm:p-10 md:p-12 lg:p-14 flex flex-col justify-center">
          <div className="max-w-[380px] w-full mx-auto">
            {/* Header Title & Subtitle */}
            <div className="text-center md:text-left mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight flex items-center justify-center md:justify-start gap-2">
                <span>{mode === "login" ? "Welcome back" : "Create an account"}</span>
                <span className="inline-block transform hover:rotate-12 transition-transform duration-200">
                  {mode === "login" ? "👋" : "✨"}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 font-normal">
                {mode === "login" ? "Please enter your details." : "Join us and discover modern Web Apps."}
              </p>
            </div>

            {/* Social Logins: Google and GitHub */}
            <div className="space-y-2.5 mb-5">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                disabled={Boolean(socialLoading) || loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-full border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100 text-xs sm:text-sm font-medium text-neutral-700 transition duration-150 shadow-sm disabled:opacity-60 cursor-pointer"
              >
                {socialLoading === "google" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* GitHub Button */}
              <button
                type="button"
                onClick={() => handleSocialLogin("github")}
                disabled={Boolean(socialLoading) || loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-full border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100 text-xs sm:text-sm font-medium text-neutral-700 transition duration-150 shadow-sm disabled:opacity-60 cursor-pointer"
              >
                {socialLoading === "github" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                ) : (
                  <svg className="w-4 h-4 fill-current text-neutral-900" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                )}
                <span>Continue with GitHub</span>
              </button>
            </div>

            {/* Divider "or" */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="w-full border-t border-neutral-200" />
              <span className="absolute bg-white px-3 text-xs text-neutral-400 font-medium">or</span>
            </div>

            {/* Error & Success Feedback Alerts */}
            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50/90 border border-red-200/80 flex items-start gap-2.5 text-xs text-red-600 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-700 animate-in fade-in slide-in-from-top-1 duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{success}</span>
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Name field (Only in Sign Up Mode) */}
              {mode === "signup" && (
                <div className="relative rounded-full border border-neutral-200 hover:border-neutral-300 focus-within:border-[#f97316] focus-within:ring-2 focus-within:ring-[#f97316]/20 transition-all duration-150">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                    autoComplete="name"
                    className="w-full bg-transparent px-5 py-3 pr-11 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none rounded-full"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div className="relative rounded-full border border-neutral-200 hover:border-neutral-300 focus-within:border-[#f97316] focus-within:ring-2 focus-within:ring-[#f97316]/20 transition-all duration-150">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  className="w-full bg-transparent px-5 py-3 pr-11 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none rounded-full"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative rounded-full border border-neutral-200 hover:border-neutral-300 focus-within:border-[#f97316] focus-within:ring-2 focus-within:ring-[#f97316]/20 transition-all duration-150">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full bg-transparent px-5 py-3 pr-11 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none rounded-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition cursor-pointer p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Options Row: Remember & Forgot Password */}
              <div className="flex items-center justify-between pt-1 pb-1 px-1">
                <label className="flex items-center gap-2 text-[11px] sm:text-xs text-neutral-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-neutral-300 text-[#f97316] focus:ring-[#f97316] cursor-pointer accent-[#f97316]"
                  />
                  <span>Remember for 30 days</span>
                </label>

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setError("如需重置密码，请联系管理员或使用邮箱注册")}
                    className="text-[11px] sm:text-xs text-neutral-500 hover:text-neutral-900 font-medium transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              {/* Primary Action Button (Tangerine/Warm Orange Pill) */}
              <button
                type="submit"
                disabled={loading || Boolean(socialLoading)}
                className="w-full rounded-full bg-[#f97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white py-3 sm:py-3.5 text-xs sm:text-sm font-semibold shadow-[0_4px_16px_rgba(249,115,22,0.32)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.4)] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                <span>{mode === "login" ? "Log In" : "Sign Up"}</span>
              </button>
            </form>

            {/* Bottom Toggle Link */}
            <div className="mt-6 sm:mt-7 text-center text-xs text-neutral-500">
              {mode === "login" ? (
                <p>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                      setSuccess(null);
                    }}
                    className="font-semibold text-neutral-900 hover:underline cursor-pointer ml-1"
                  >
                    Sign Up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                      setSuccess(null);
                    }}
                    className="font-semibold text-neutral-900 hover:underline cursor-pointer ml-1"
                  >
                    Log In
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Illustration Placeholder (Sunset Rice Terraces Theme) */}
        <div className="hidden md:flex md:w-1/2 p-3 sm:p-4 md:p-5">
          <div className="w-full h-full min-h-[300px] sm:min-h-[400px] md:min-h-[580px] rounded-[22px] sm:rounded-[28px] overflow-hidden relative shadow-inner flex flex-col justify-between">
            {/*
              Atmospheric Illustration matching the sunset terrace landscape in Image #1
              Built with layered SVGs and rich gradients so it renders gorgeously out of the box,
              while leaving room for any custom artwork drop-in.
            */}
            <svg
              className="absolute inset-0 w-full h-full object-cover select-none"
              viewBox="0 0 600 780"
              preserveAspectRatio="xMidYMid slice"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Sky Gradient */}
                <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f7bc45" />
                  <stop offset="28%" stopColor="#f99831" />
                  <stop offset="55%" stopColor="#ef5b3a" />
                  <stop offset="78%" stopColor="#c53b49" />
                  <stop offset="100%" stopColor="#4f2038" />
                </linearGradient>

                {/* Distant Mountains Gradient */}
                <linearGradient id="distMtn" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ca4948" />
                  <stop offset="100%" stopColor="#671e35" />
                </linearGradient>

                {/* Rice Terrace Deep Greens */}
                <linearGradient id="terraceDark" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1f4f22" />
                  <stop offset="100%" stopColor="#0d2411" />
                </linearGradient>

                <linearGradient id="terraceMid" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#326c2e" />
                  <stop offset="100%" stopColor="#173d19" />
                </linearGradient>

                <linearGradient id="terraceLush" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4e8c3b" />
                  <stop offset="100%" stopColor="#255923" />
                </linearGradient>

                {/* Sun Glow Filter */}
                <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fff8db" stopOpacity="1" />
                  <stop offset="40%" stopColor="#fde047" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Sky Background */}
              <rect width="600" height="780" fill="url(#skyGrad)" />

              {/* Soft Distant Clouds */}
              <path
                d="M-50,140 Q150,100 350,150 T700,120 L700,280 L-50,280 Z"
                fill="#ffaa54"
                opacity="0.35"
              />
              <path
                d="M-50,180 Q200,150 450,190 T750,170 L750,330 L-50,330 Z"
                fill="#f16d4e"
                opacity="0.3"
              />

              {/* Golden Sun */}
              <circle cx="370" cy="180" r="16" fill="#fffbe8" />
              <circle cx="370" cy="180" r="48" fill="url(#sunGlow)" opacity="0.65" />

              {/* Distant Mountain Ridges */}
              <path
                d="M-20,240 Q120,210 260,250 T540,230 Q600,240 650,260 L650,420 L-20,420 Z"
                fill="url(#distMtn)"
                opacity="0.85"
              />
              <path
                d="M-20,280 Q180,260 380,310 T650,290 L650,480 L-20,480 Z"
                fill="#8f2d3d"
                opacity="0.9"
              />

              {/* Terraced Fields - Upper Flowing Curves */}
              <path
                d="M-20,330 Q140,320 280,370 T650,340 L650,780 L-20,780 Z"
                fill="#153d19"
              />
              <path
                d="M-20,370 Q160,350 320,410 T650,380 L650,780 L-20,780 Z"
                fill="#1d4d21"
              />

              {/* Middle Terraces (Concentric Stepped Curves) */}
              <path
                d="M-20,410 C120,390 220,420 340,440 C460,460 550,410 650,430 L650,780 L-20,780 Z"
                fill="url(#terraceMid)"
              />
              <path
                d="M-20,450 C110,430 200,470 330,480 C460,490 540,450 650,470 L650,780 L-20,780 Z"
                fill="url(#terraceDark)"
              />

              {/* Center Rice Terrace Mound (The focal tiered hill in the image) */}
              <ellipse cx="360" cy="510" rx="160" ry="42" fill="#2c6928" />
              <ellipse cx="360" cy="524" rx="146" ry="38" fill="#1b4619" />
              <ellipse cx="360" cy="536" rx="130" ry="34" fill="#316e2c" />
              <ellipse cx="360" cy="548" rx="116" ry="30" fill="#173f15" />

              {/* Swirling Terraced Contour Paths */}
              <path
                d="M-50,490 C120,470 180,550 320,570 C460,590 560,520 680,550 L680,820 L-50,820 Z"
                fill="url(#terraceLush)"
              />
              <path
                d="M-50,540 C140,510 200,600 340,620 C480,640 570,570 680,600 L680,820 L-50,820 Z"
                fill="url(#terraceMid)"
              />
              <path
                d="M-50,590 C160,560 210,650 360,670 C500,690 580,620 680,650 L680,820 L-50,820 Z"
                fill="url(#terraceDark)"
              />

              {/* Foreground Lush Green Foliage */}
              <path
                d="M-50,640 C120,620 220,720 400,710 C520,700 600,670 680,710 L680,850 L-50,850 Z"
                fill="#2e6d2b"
              />
              <path
                d="M-50,680 C80,650 180,740 380,730 C500,720 580,700 680,730 L680,850 L-50,850 Z"
                fill="#164219"
              />

              {/* Foreground Stylized Farmer with Conical Hat */}
              <g transform="translate(130, 480)">
                {/* Farmer Hat (Conical Straw Hat) */}
                <polygon points="120,80 70,120 170,120" fill="#edd698" />
                <polygon points="120,80 70,120 115,120" fill="#dfc37f" />
                {/* Head / Shadow */}
                <ellipse cx="120" cy="125" rx="16" ry="12" fill="#3a2518" />
                {/* Body / Indigo Blue Clothes */}
                <path
                  d="M100,132 C90,145 60,180 50,220 L190,220 C180,180 150,145 140,132 Z"
                  fill="#1c2738"
                />
                {/* Collar Accent */}
                <polygon points="120,132 110,150 130,150" fill="#3b557b" />
              </g>

              {/* Foreground Tall Rice Grass Blades on Bottom Corners */}
              <path
                d="M0,780 L20,710 L30,780 L50,690 L65,780 L90,720 L110,780 Z"
                fill="#397c35"
              />
              <path
                d="M480,780 L500,710 L520,780 L540,680 L560,780 L580,700 L600,780 Z"
                fill="#326c2e"
              />
              <path
                d="M510,780 L535,695 L550,780 L575,670 L590,780 Z"
                fill="#19471c"
              />
            </svg>

            {/* Subtle Top-Right Badge Indicating Theme/Customization */}
            <div className="relative z-10 p-4 sm:p-6 flex justify-end">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md text-[11px] font-medium text-white/90 border border-white/15 shadow-sm">
                <span>插画展示区域</span>
              </div>
            </div>

            {/* Subtle Bottom Ambient Gradient Overlay */}
            <div className="relative z-10 p-4 sm:p-6 bg-gradient-to-t from-black/40 via-transparent to-transparent">
              <p className="text-white/80 text-xs font-medium tracking-wide">
                Web App Store · 开启全平台现代 Web 应用探索
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
