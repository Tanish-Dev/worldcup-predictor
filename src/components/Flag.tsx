import Image from "next/image";
import { flagUrl } from "@/lib/flags";

const PX: Record<string, number> = { sm: 20, md: 28, lg: 44, xl: 64 };
const CDN_SIZE: Record<string, 2 | 3 | 4> = { sm: 2, md: 2, lg: 3, xl: 4 };

export default function Flag({
  code,
  name,
  size = "sm",
  className = "",
}: {
  code: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const px = PX[size];
  return (
    <Image
      src={flagUrl(code, CDN_SIZE[size])}
      alt={`${name} flag`}
      width={px}
      height={px}
      className={`inline-block shrink-0 rounded-full object-cover ring-1 ring-border ${className}`}
      style={{ width: px, height: px }}
    />
  );
}
