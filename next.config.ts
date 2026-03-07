import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */

const nextConfig: NextConfig = {
  images: {
    domains: ['images.unsplash.com', 'picsum.photos'], // أضف الدومينز اللي بتستخدمها
  },};

export default nextConfig;
module.exports = nextConfig