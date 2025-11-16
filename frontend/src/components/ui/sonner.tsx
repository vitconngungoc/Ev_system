"use client";

import { useTheme } from "next-themes@0.4.6";
import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton={true}
      position="top-right"
      expand={false}
      richColors
      duration={4000}
      style={
        {
          "--normal-bg": "white",
          "--normal-text": "#09090b",
          "--normal-border": "#e4e4e7",
          "--success-bg": "#f0fdf4",
          "--success-text": "#166534",
          "--success-border": "#86efac",
          "--error-bg": "#fef2f2",
          "--error-text": "#991b1b",
          "--error-border": "#fca5a5",
          "--warning-bg": "#fffbeb",
          "--warning-text": "#92400e",
          "--warning-border": "#fcd34d",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border group-[.toaster]:border-gray-200 group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:min-w-[320px]',
          description: 'group-[.toast]:text-gray-600 group-[.toast]:text-sm group-[.toast]:mt-1',
          actionButton: 'group-[.toast]:bg-gray-900 group-[.toast]:text-white group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:rounded-xl group-[.toast]:font-medium group-[.toast]:hover:bg-gray-800 group-[.toast]:transition-colors',
          cancelButton: 'group-[.toast]:bg-gray-100 group-[.toast]:text-gray-700 group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:rounded-xl group-[.toast]:font-medium group-[.toast]:hover:bg-gray-200 group-[.toast]:transition-colors',
          closeButton: 'group-[.toast]:bg-white group-[.toast]:border group-[.toast]:border-gray-200 group-[.toast]:hover:bg-gray-100 group-[.toast]:transition-colors group-[.toast]:rounded-lg group-[.toast]:w-8 group-[.toast]:h-8',
          success: 'group-[.toaster]:!bg-green-50 group-[.toaster]:!border-green-200 group-[.toaster]:!text-green-900',
          error: 'group-[.toaster]:!bg-red-50 group-[.toaster]:!border-red-200 group-[.toaster]:!text-red-900',
          warning: 'group-[.toaster]:!bg-yellow-50 group-[.toaster]:!border-yellow-200 group-[.toaster]:!text-yellow-900',
          info: 'group-[.toaster]:!bg-blue-50 group-[.toaster]:!border-blue-200 group-[.toaster]:!text-blue-900',
          title: 'group-[.toast]:font-semibold group-[.toast]:text-base',
          icon: 'group-[.toast]:w-5 group-[.toast]:h-5',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

