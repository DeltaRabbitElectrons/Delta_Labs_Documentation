import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React, { useRef, useState, useCallback } from "react";

import { NodeViewProps } from "@tiptap/react";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

// ── React component for the image node ─────────────────────────────
function ResizableImageComponent({ node, updateAttributes, selected }: NodeViewProps) {
  const [resizing, setResizing] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const { src, alt, width, height, align } = node.attrs;

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setResizing(true);
      startX.current = e.clientX;
      startWidth.current = imgRef.current?.offsetWidth || 300;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX.current;
        const newWidth = Math.max(100, startWidth.current + delta);
        updateAttributes({ width: newWidth });
      };

      const onMouseUp = () => {
        setResizing(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [updateAttributes]
  );

  const alignStyle: React.CSSProperties =
    align === "center"
      ? { display: "block", margin: "1.5rem auto" }
      : align === "right"
      ? { display: "block", marginLeft: "auto", margin: "1.5rem 0 1.5rem auto" }
      : { display: "block", margin: "1.5rem 0" };

  // Guard: don't render <img> with empty/null src — that causes browser network errors
  if (!src) {
    return (
      <NodeViewWrapper className="resizable-image-wrapper">
        <div
          style={{
            width: 200,
            height: 100,
            background: "#f1f5f9",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
            fontSize: 13,
            border: "1px dashed #cbd5e1",
          }}
        >
          No image
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className={`resizable-image-wrapper ${selected ? "selected" : ""}`}
      draggable
      data-drag-handle
    >
      <div
        style={{
          position: "relative",
          display: "inline-block",
          ...alignStyle,
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt || ""}
          style={{
            width: width ? `${width}px` : "100%",
            height: height ? `${height}px` : "auto",
            display: "block",
            borderRadius: "6px",
            border: "1px solid var(--border)",
            outline: selected ? "2px solid var(--accent-primary)" : "none",
            outlineOffset: "4px",
            cursor: resizing ? "ew-resize" : "default",
          }}
        />

        {/* Alignment controls — shown when image is selected */}
        {selected && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-white border border-[var(--border)] rounded-[6px] shadow-lg z-50">
            <button
              onClick={() => updateAttributes({ align: "left" })}
              className={`w-7 h-7 flex items-center justify-center rounded-[4px] transition-all ${align === "left" ? "bg-[var(--accent-primary)] text-white" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"}`}
              title="Align left"
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => updateAttributes({ align: "center" })}
              className={`w-7 h-7 flex items-center justify-center rounded-[4px] transition-all ${align === "center" ? "bg-[var(--accent-primary)] text-white" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"}`}
              title="Align center"
            >
              <AlignCenter size={14} />
            </button>
            <button
              onClick={() => updateAttributes({ align: "right" })}
              className={`w-7 h-7 flex items-center justify-center rounded-[4px] transition-all ${align === "right" ? "bg-[var(--accent-primary)] text-white" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"}`}
              title="Align right"
            >
              <AlignRight size={14} />
            </button>
          </div>
        )}

        {/* Resize handle — bottom right corner */}
        {selected && (
          <div
            className="absolute bottom-[-8px] right-[-8px] w-4 h-4 bg-[var(--accent-primary)] border-2 border-white rounded-full cursor-se-resize shadow-sm z-50"
            onMouseDown={startResize}
            title="Drag to resize"
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}

// ── Tiptap node definition ──────────────────────────────────────────
const ResizableImage = Node.create({
  name: "resizableImage",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      width: { default: null },
      height: { default: null },
      align: { default: "left" },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

export default ResizableImage;
