import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ParticipantSearchInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
};

export function ParticipantSearchInput({
  id,
  value,
  onChange,
  placeholder = "Prénom, nom ou e-mail…",
  className,
  "aria-label": ariaLabel,
}: ParticipantSearchInputProps) {
  return (
    <div className={cn("relative min-w-0 max-w-full", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        aria-label={ariaLabel ?? "Rechercher parmi les participants"}
        className="h-10 bg-background/80 pl-9 pr-3"
      />
    </div>
  );
}
