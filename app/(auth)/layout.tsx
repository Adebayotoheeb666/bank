'use client';

import Image from "next/image";
import { ToastProvider } from "@/context/ToastContext";
import { ToastContainer } from "@/components/ToastContainer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ToastProvider>
      <main className="flex min-h-screen w-full justify-between font-inter">
        {children}
        <div className="auth-asset">
          <div>
            <Image
              src="/icons/auth-image.svg"
              alt="Auth image"
              width={500}
              height={500}
              className="rounded-l-xl object-contain"
            />
          </div>
        </div>
      </main>
      <ToastContainer />
    </ToastProvider>
  );
}
