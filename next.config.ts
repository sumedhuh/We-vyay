import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ["e60ed4c898891208-223-236-99-11.serveousercontent.com", "vyay-dev-1234.loca.lt", "sharp-days-camp.loca.lt", "4e003898448ade4b-223-236-99-11.serveousercontent.com", "metal-keys-wave.loca.lt", "modern-regions-dress.loca.lt", "silent-parks-visit.loca.lt", "massive-moose-85.loca.lt", "9307a446c86537.lhr.life", "5ebd86f595cc46.lhr.life", "a236315e3a65ad.lhr.life", "upset-files-chew.loca.lt", "87b450175c2832.lhr.life", "c464d3211e0c00.lhr.life", "9744fef1c3ed9d.lhr.life"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
};

export default nextConfig;
