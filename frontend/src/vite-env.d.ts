/// <reference types="vite/client" />

// Vite already includes declarations for *.png, *.jpg, *.jpeg, *.svg, *.gif, *.webp
// Only declare the custom Figma asset alias
declare module 'figma:asset/*' {
  const src: string;
  export default src;
}
