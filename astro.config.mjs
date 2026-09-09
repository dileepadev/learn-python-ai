// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages project site: https://dileepadev.github.io/learn-python-ai
export default defineConfig({
  site: "https://dileepadev.github.io",
  base: "/learn-python-ai",
  trailingSlash: "ignore",
  integrations: [react(), mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark-default" },
      wrap: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    // Pyodide is loaded from the CDN at runtime inside a module worker,
    // so nothing Python-related should ever enter the client bundle.
    optimizeDeps: { exclude: ["pyodide"] },
  },
});
