import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

const APP_URL = "/app/index.html#/home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AniVerse Library — Anime, Manga, Bible, Novels, Music" },
      {
        name: "description",
        content:
          "A lightweight personal media library for anime, manga, Bible, novels and music — built to run on iPad iOS 9.3.5 Safari and modern browsers.",
      },
      { property: "og:title", content: "AniVerse Library — Anime, Manga, Bible, Novels, Music" },
      {
        property: "og:description",
        content: "A lightweight personal media library for anime, manga, Bible, novels and music — built to run on iPad iOS 9.3.5 Safari and modern browsers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace(APP_URL);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-foreground">AniVerse Library</h1>
        <p className="mt-2 text-sm text-muted-foreground">Anime • Manga • Bible • Novels • Music</p>
        <p className="mt-6">
          <a className="underline" href={APP_URL}>
            Open the library
          </a>
        </p>
        {/* Legacy-Safari fallback: no JS needed to reach the app. */}
        <noscript>
          <meta httpEquiv="refresh" content={`0;url=${APP_URL}`} />
        </noscript>
      </div>
    </div>
  );
}
