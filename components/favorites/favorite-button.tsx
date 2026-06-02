"use client";

import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}

export function FavoriteButton({ active, disabled, onClick, label }: FavoriteButtonProps) {
  return (
    <Button
      aria-label={label}
      disabled={disabled}
      size="icon"
      variant="ghost"
      onClick={onClick}
    >
      <Heart className={cn("size-4", active && "fill-current text-primary")} />
    </Button>
  );
}
