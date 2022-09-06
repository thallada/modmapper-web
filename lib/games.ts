export type GameName = "skyrim" | "skyrimspecialedition";

// Translates gameName (e.g. "skyrim" or "skyrimspecialedition") to edition name which is displayed in the
// UI ("Classic" or "Special Edition").
export const editionNames: Record<GameName, string> = {
  skyrim: 'Classic',
  skyrimspecialedition: 'Special Edition',
};