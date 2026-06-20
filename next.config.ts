/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // 🔹 Google profile pictures
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // 🔹 Firebase Storage images
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      // 🔹 GitHub avatars
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      // 🔹 Twitter profile images (pbs.twimg.com)
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
      // 🔹 LinkedIn images
      {
        protocol: "https",
        hostname: "media.licdn.com",
      },
      // 🔹 Optional: Cloudinary or Unsplash (for image uploads or placeholders)
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
}

module.exports = nextConfig
