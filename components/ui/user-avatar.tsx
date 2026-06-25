"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  className?: string;
}

export function UserAvatar({ name, email, image, className }: UserAvatarProps) {
  const fallback = (name?.[0] || email?.[0] || "U").toUpperCase();

  return (
    <Avatar className={className}>
      <AvatarImage src={image || undefined} alt={name || "User"} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}
