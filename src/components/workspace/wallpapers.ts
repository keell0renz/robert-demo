// The selectable backgrounds for the design space. `background` is a raw CSS
// background value (a gradient token or an image url()); `thumb` is the small
// preview shown in the picker grid (the gradient default has no thumb — the
// tile renders the gradient itself).
export type Wallpaper = {
  id: string;
  label: string;
  background: string;
  thumb?: string;
  // Tile preview when there's no `thumb`.
  preview?: string;
};

export const DEFAULT_WALLPAPER_ID = "tahoe-light";
export const WALLPAPER_STORAGE_KEY = "design-wallpaper";

export const WALLPAPERS: Wallpaper[] = [
  {
    id: "tahoe-light",
    label: "Tahoe Light",
    background: "url('/wallpapers/tahoe-light.jpg')",
    thumb: "/wallpapers/tahoe-light-thumb.jpg",
  },
  {
    id: "tahoe-dark",
    label: "Tahoe Dark",
    background: "url('/wallpapers/tahoe-dark.jpg')",
    thumb: "/wallpapers/tahoe-dark-thumb.jpg",
  },
];

export function wallpaperById(id: string | null | undefined): Wallpaper {
  return WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];
}
