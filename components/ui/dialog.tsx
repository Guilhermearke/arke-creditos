// @ts-nocheck
'use client';

import * as React from 'react';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
          onClick={() => onOpenChange?.(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        </div>
      )}
    </>
  );
};

export const DialogContent = ({ className, children }: DialogContentProps) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 ${className || ''}`}
    >
      {children}
    </div>
  );
};

export const DialogHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 py-4 border-b ${className || ''}`}>
    {children}
  </div>
);

export const DialogTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold">{children}</h2>
);

export const DialogFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 py-4 border-t flex justify-end gap-2 ${className || ''}`}>
    {children}
  </div>
);
