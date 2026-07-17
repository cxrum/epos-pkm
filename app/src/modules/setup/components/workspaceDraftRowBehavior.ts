export interface SelectableInput {
  focus(): void;
  select(): void;
}

export const focusAndSelectInput = (
  input: SelectableInput | null | undefined,
) => {
  if (!input) {
    return;
  }

  input.focus();
  input.select();
};

export const resolveWorkspaceDraftRowAction = (key: string) => {
  if (key === "Enter") {
    return "commit";
  }

  if (key === "Escape") {
    return "cancel";
  }

  return null;
};
