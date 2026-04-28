import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@shared/lib/utils";

import { Button } from "./button";

type ModalOverlayProps = {
  children: ReactNode;
  onClose: () => void;
};

type ModalProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  closeLabel?: string;
  onClose: () => void;
};

const MODAL_EXIT_DURATION_MS = 170;
const ModalCloseContext = createContext<(() => void) | null>(null);

export function useModalClose() {
  return useContext(ModalCloseContext);
}

function prefersReducedMotion() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ModalOverlay({ children, onClose }: ModalOverlayProps) {
  const [isVisible, setVisible] = useState(() => prefersReducedMotion());
  const onCloseRef = useRef(onClose);
  const openFrameRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const isCloseRequestedRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    openFrameRef.current = window.requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => {
      if (openFrameRef.current !== null) {
        window.cancelAnimationFrame(openFrameRef.current);
      }
    };
  }, []);

  const close = useCallback(() => {
    if (isCloseRequestedRef.current) {
      return;
    }

    isCloseRequestedRef.current = true;
    setVisible(false);

    const exitDuration = prefersReducedMotion() ? 0 : MODAL_EXIT_DURATION_MS;

    closeTimeoutRef.current = window.setTimeout(() => {
      onCloseRef.current();
    }, exitDuration);
  }, []);

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }

      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);

      if (previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus();
      }
    };
  }, [close]);

  const animationState = isVisible ? "open" : "closed";

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 data-[state=closed]:pointer-events-none"
      data-state={animationState}
    >
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-foreground/40 opacity-0 transition-opacity data-[state=closed]:duration-150 data-[state=open]:duration-200 data-[state=open]:opacity-100 data-[state=open]:ease-out data-[state=closed]:ease-[cubic-bezier(0.7,0,0.84,0)] motion-reduce:transition-none"
        data-state={animationState}
        onClick={close}
      />
      <div
        className="relative z-10 w-full max-w-5xl opacity-0 transition-opacity data-[state=closed]:duration-150 data-[state=open]:duration-200 data-[state=open]:opacity-100 data-[state=open]:ease-out data-[state=closed]:ease-[cubic-bezier(0.7,0,0.84,0)] motion-reduce:transition-none"
        data-state={animationState}
      >
        <ModalCloseContext.Provider value={close}>{children}</ModalCloseContext.Provider>
      </div>
    </div>,
    document.body,
  );
}

export function Modal({ ariaLabel, children, className, closeLabel, onClose }: ModalProps) {
  return (
    <ModalOverlay onClose={onClose}>
      <ModalDialog
        ariaLabel={ariaLabel}
        className={className}
        closeLabel={closeLabel}
        onClose={onClose}
      >
        {children}
      </ModalDialog>
    </ModalOverlay>
  );
}

function ModalDialog({ ariaLabel, children, className, closeLabel, onClose }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalClose = useModalClose();
  const close = modalClose ?? onClose;

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <section
      aria-label={ariaLabel}
      aria-modal="true"
      className={cn(
        "relative max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border bg-card p-5 text-card-foreground shadow-xl",
        className,
      )}
      role="dialog"
    >
      <Button
        aria-label={closeLabel ?? `Close ${ariaLabel}`}
        className="absolute right-3 top-3"
        onClick={close}
        ref={closeButtonRef}
        size="icon"
        type="button"
        variant="ghost"
      >
        <X aria-hidden="true" />
      </Button>
      <div className="pr-10">{children}</div>
    </section>
  );
}
