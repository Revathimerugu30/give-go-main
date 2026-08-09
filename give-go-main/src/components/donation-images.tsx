import { useEffect, useState } from "react";
import { signedUrls } from "@/lib/storage";
import { ImageOff } from "lucide-react";

/** Renders donation photos from private storage paths using signed URLs. */
export function DonationImages({
  paths,
  className = "",
  size = "size-16",
}: {
  paths: string[] | null | undefined;
  className?: string;
  size?: string;
}) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    if (!paths || paths.length === 0) {
      setUrls([]);
      return;
    }
    void signedUrls(paths).then((u) => {
      if (active) setUrls(u);
    });
    return () => {
      active = false;
    };
  }, [paths]);

  if (!paths || paths.length === 0) {
    return (
      <span
        className={`flex ${size} items-center justify-center rounded-xl bg-muted text-muted-foreground ${className}`}
      >
        <ImageOff className="size-4" />
      </span>
    );
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {urls.map((u) => (
        <img
          key={u}
          src={u}
          alt="Donated item"
          loading="lazy"
          className={`${size} rounded-xl border border-border object-cover`}
        />
      ))}
    </div>
  );
}
