export const cn = (
  ...classes: Array<string | false | null | undefined>
): string => classes.filter(Boolean).join(" ");

export const createId = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
