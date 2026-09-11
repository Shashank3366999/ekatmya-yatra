import type { MetadataRoute } from "next";

/**
 * Web app manifest.
 *
 * The brief is explicit that this is a web app opened in Chrome, not a native
 * build — but most Shankardoots will use it one-handed in the field, so it
 * should behave like an app there. With this, Chrome offers "Add to home
 * screen": the Yatra gets its own icon, opens without browser chrome, and
 * launches straight into the organiser dashboard.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ekatma Yatra 2027",
    short_name: "Ekatma Yatra",
    description:
      "A Bharat Yatra for oneness tracing Adi Shankaracharya's Digvijaya Yatra, 16 January to 10 May 2027.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#14523c",
    theme_color: "#14523c",
    lang: "en-IN",
    categories: ["travel", "education", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "The Yatra route", url: "/yatra" },
      { name: "Add a survey entry", url: "/o/survey/new" },
      { name: "Announcements", url: "/announcements" },
    ],
  };
}
