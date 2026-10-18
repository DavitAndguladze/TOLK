"use client";
// Faint paper grain behind the Library (Paper Shaders, rendered once: speed 0, so no motion and no battery drain).
import { PaperTexture } from "@paper-design/shaders-react";

export function PaperBackground() {
  return (
    <PaperTexture
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
      speed={0}
      fit="cover"
      scale={1}
      colorBack="#fbf3dc"
      colorPaper="#fbf3dc"
      colorShadow="#e9dcb8"
      roughness={0.35}
      fiber={0.3}
      folds={0}
      wrinkles={0}
      crumples={0}
      drops={0}
    />
  );
}
