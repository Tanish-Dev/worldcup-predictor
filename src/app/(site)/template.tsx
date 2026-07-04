import { ViewTransition } from "react";

/**
 * Remounts on every navigation, so the ViewTransition fires enter/exit for
 * each page change. Links tagged transitionTypes={["nav-forward"]} slide the
 * page text rightwards; untyped navigations (going home, browser back)
 * crossfade.
 */
export default function SiteTemplate({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "page-slide", default: "page-fade" }}
      exit={{ "nav-forward": "page-slide", default: "page-fade" }}
      default="none"
    >
      <div>{children}</div>
    </ViewTransition>
  );
}
