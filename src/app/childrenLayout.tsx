"use client";

import { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import { Provider as JotaiProvider } from "jotai";

export default function ClientLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();

  // 특정 경로에서는 마진을 0으로 설정
  const marginClass = ["/login", "/signup", "/"].includes(pathname) ? "" : "xl:ml-[300px] md:ml-[160px] ml-[67px]";

  return (
    <JotaiProvider>
      <div className={marginClass}>{children}</div>
    </JotaiProvider>
  );
}
