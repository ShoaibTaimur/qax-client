import { cn } from "@/lib/utils";
const faviconAsset = { url: "/favicon.png" };

export function LoadingScreen({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center gap-6 bg-background",
        className,
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-md bg-primary/30" />
        <img
          src={faviconAsset.url}
          alt="QAX"
          className="relative h-14 w-14 rounded-md shadow-lg"
        />
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:-0.3s]" />
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:-0.15s]" />
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

export function InlineLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
