"use client";

import { useEffect, useRef, type TextareaHTMLAttributes } from "react";

type FormTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  maxAutoHeight?: number;
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function FormTextarea({
  className,
  maxAutoHeight = 420,
  onChange,
  value,
  ...props
}: FormTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const node = textareaRef.current;

    if (!node) {
      return;
    }

    node.style.height = "0px";
    const nextHeight = Math.min(node.scrollHeight, maxAutoHeight);
    node.style.height = `${nextHeight}px`;
    node.style.overflowY =
      node.scrollHeight > maxAutoHeight ? "auto" : "hidden";
  }, [maxAutoHeight, value]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      value={value}
      onChange={onChange}
      className={cx("app-textarea", className)}
    />
  );
}
