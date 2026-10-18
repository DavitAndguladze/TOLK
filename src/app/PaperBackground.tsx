"use client";
// Faint paper grain behind the Library (Paper Shaders, speed 0: rendered once, then idle except on resize).
import { PaperTexture } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";

export function PaperBackground() {
  // The shader's async init rejects unhandled without WebGL2, so keep the plain cream body then.
  const [webgl2, setWebgl2] = useState(false);
  useEffect(() => setWebgl2(!!document.createElement("canvas").getContext("webgl2")), []);
  if (!webgl2) return null;

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
