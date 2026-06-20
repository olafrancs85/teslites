"use client";

import Image from "next/image";

interface UserAvatarProps {
  photoURL?: string;
  username?: string;
  size?: number;
  className?: string;
}

export default function UserAvatar({
  photoURL,
  username,
  size = 100,
  className = "",
}: UserAvatarProps) {
  const fallbackSrc = "/default-avatar.png";

  return (
    <Image
      src={photoURL || fallbackSrc}
      alt={username || "User"}
      width={size}
      height={size}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = fallbackSrc;
      }}
      className={`rounded-full border border-gray-700 object-cover ${className}`}
    />
  );
}
