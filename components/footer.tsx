import Link from "next/link";
import { Logo } from "@/components/logo";
import { SITE_CONFIG } from "@/lib/config";
export function Footer() {
  return (
    <footer className="w-full bg-surface-card border-t border-border text-foreground">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-14 sm:py-16 flex flex-col justify-between min-h-[380px]">
        {/* Main Content: Left Brand & Reserved Illustration space, Right Navigation Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Left: Brand Identity & Blank space reserved for illustration */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <Logo variant="footer" href="/" size="md" />

            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
              {SITE_CONFIG.subTagline}
            </p>

            {/* Blank placeholder area reserved for future decorative illustration/artwork */}
            <div className="hidden sm:block min-h-[120px] w-full" aria-hidden="true" />
          </div>

          {/* Right: 3 Navigation Columns matching reference layout */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-10">
            {/* Column 1 */}
            <div className="space-y-4">
              <h4 className="text-xs sm:text-sm font-bold tracking-tight text-foreground">
                发现探索
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <Link href="/today" className="hover:text-foreground transition-colors">
                    Today 精选
                  </Link>
                </li>
                <li>
                  <Link href="/category/all" className="hover:text-foreground transition-colors">
                    全部应用
                  </Link>
                </li>
                <li>
                  <Link href="/category/游戏" className="hover:text-foreground transition-colors">
                    游戏专区
                  </Link>
                </li>
                <li>
                  <Link href="/category/工具" className="hover:text-foreground transition-colors">
                    效率工具
                  </Link>
                </li>
                <li>
                  <Link href="/category/AI" className="hover:text-foreground transition-colors">
                    AI 应用
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <h4 className="text-xs sm:text-sm font-bold tracking-tight text-foreground">
                收录服务
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <Link href="/recommend" className="hover:text-black font-semibold transition-colors">
                    推荐 / 投放应用
                  </Link>
                </li>
                <li>
                  <Link href="/recommend" className="hover:text-foreground transition-colors">
                    AI 自动快照管线
                  </Link>
                </li>
                <li>
                  <span className="cursor-default text-muted-foreground/70">
                    收录标准指引
                  </span>
                </li>
                <li>
                  <span className="cursor-default text-muted-foreground/70">
                    开发者合作
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="space-y-4 col-span-2 sm:col-span-1">
              <h4 className="text-xs sm:text-sm font-bold tracking-tight text-foreground">
                关于平台
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <span className="cursor-default text-muted-foreground/70">
                    关于我们
                  </span>
                </li>
                <li>
                  <span className="cursor-default text-muted-foreground/70">
                    服务条款
                  </span>
                </li>
                <li>
                  <span className="cursor-default text-muted-foreground/70">
                    隐私政策
                  </span>
                </li>
                <li>
                  <span className="cursor-default text-muted-foreground/70">
                    联系与反馈
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Row: Copyright on left, blank slot on right for future social media assets */}
        <div className="border-t border-border pt-8 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>{SITE_CONFIG.copyright}</p>

          {/* Blank reserved slot for social media icons/images (left empty as requested) */}
          <div className="flex items-center gap-4 min-w-[140px] justify-end" aria-hidden="true" />
        </div>
      </div>
    </footer>
  );
}
