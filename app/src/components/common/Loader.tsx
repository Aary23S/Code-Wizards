"use client";

import React from "react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "pulse" | "code";
  text?: string;
  fullScreen?: boolean;
}

/**
 * Modern animated loader component suitable for coding websites
 * Multiple variants: spinner, dots, pulse, code
 */
export default function Loader({
  size = "md",
  variant = "spinner",
  text,
  fullScreen = false,
}: LoaderProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const containerClass = fullScreen
    ? "fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
    : "flex items-center justify-center";

  const contentClass = fullScreen
    ? "flex flex-col items-center justify-center gap-4"
    : "flex flex-col items-center justify-center gap-3";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Spinner Variant (Default) */}
        {variant === "spinner" && (
          <div
            className={`${sizeClasses[size]} relative`}
            style={{ perspective: "1000px" }}
          >
            <style>{`
              @keyframes spin3d {
                0% { transform: rotateX(0) rotateY(0); }
                100% { transform: rotateX(360deg) rotateY(360deg); }
              }
              .loader-spinner { animation: spin3d 2s linear infinite; }
            `}</style>
            <div
              className="loader-spinner w-full h-full border-3 border-zinc-700 border-t-white border-r-white rounded-full"
              style={{ perspective: "1000px" }}
            />
          </div>
        )}

        {/* Dots Variant */}
        {variant === "dots" && (
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <style key={`dot-style-${i}`}>{`
                @keyframes bounce-dots {
                  0%, 100% { transform: translateY(0); opacity: 0.4; }
                  50% { transform: translateY(-12px); opacity: 1; }
                }
                .dot-${i} { animation: bounce-dots 1.4s ease-in-out infinite; animation-delay: ${
                i * 0.2
              }s; }
              `}</style>
            ))}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`dot-${i} w-3 h-3 bg-white rounded-full`}
              />
            ))}
          </div>
        )}

        {/* Pulse Variant */}
        {variant === "pulse" && (
          <div className="relative w-12 h-12">
            <style>{`
              @keyframes pulse-ring {
                0% { 
                  box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
                }
                70% {
                  box-shadow: 0 0 0 20px rgba(255, 255, 255, 0);
                }
                100% {
                  box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
                }
              }
              .pulse-loader {
                animation: pulse-ring 2s infinite;
              }
            `}</style>
            <div className="pulse-loader absolute inset-0 rounded-full border-2 border-white" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-white to-zinc-500 opacity-30" />
          </div>
        )}

        {/* Code Variant (Tech-themed) */}
        {variant === "code" && (
          <div className="relative w-12 h-12 flex items-center justify-center">
            <style>{`
              @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
              }
              @keyframes code-brace {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 1; }
              }
              .code-char-1 { animation: code-brace 1.2s ease-in-out infinite; animation-delay: 0s; }
              .code-char-2 { animation: code-brace 1.2s ease-in-out infinite; animation-delay: 0.2s; }
              .code-char-3 { animation: code-brace 1.2s ease-in-out infinite; animation-delay: 0.4s; }
            `}</style>
            <div className="flex gap-1 text-lg font-bold text-white">
              <span className="code-char-1">&lt;</span>
              <span className="code-char-2">/</span>
              <span className="code-char-3">&gt;</span>
            </div>
          </div>
        )}

        {/* Loading Text */}
        {text && (
          <p className="text-sm font-medium text-zinc-400 animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Button Loader - Use inside buttons for inline loading states
 */
export function ButtonLoader() {
  return (
    <style>{`
      @keyframes spin-button {
        to { transform: rotate(360deg); }
      }
      .btn-loader {
        animation: spin-button 1s linear infinite;
      }
    `}</style>
  );
}

/**
 * Loading Overlay for full-page/modal loading states
 */
export function LoadingOverlay({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <Loader variant="code" size="lg" text={text} />
    </div>
  );
}

/**
 * Skeleton Loader for content placeholders
 */
export function SkeletonLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 bg-zinc-800 rounded-lg animate-pulse w-3/4" />
          <div className="h-4 bg-zinc-800 rounded-lg animate-pulse w-full" />
          <div className="h-4 bg-zinc-800 rounded-lg animate-pulse w-5/6" />
        </div>
      ))}
    </div>
  );
}
