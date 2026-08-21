import type { MetadataRoute } from "next";

const base = "https://gnsone.com";
const routes = ["/", "/markets", "/stocks", "/ipo", "/mutual-funds", "/etfs", "/bonds", "/screener", "/compare", "/gns-score"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "/" ? "daily" : "weekly", priority: path === "/" ? 1 : 0.8 }));
}
