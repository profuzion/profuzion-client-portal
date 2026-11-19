export const CLIENT_SETTINGS_LIMITS = {
  name: 150,
  industry: 100,
  description: 600,
  slug: 65,
  accent: 20,
  website_preview_url: 1000,
} as const;

export const CLIENT_ACCENTS = {
  orange: "Profuzion orange", blue: "Slate blue",
  green: "Botanical green", violet: "Soft violet",
} as const;

export type ClientSettingsValues = Record<keyof typeof CLIENT_SETTINGS_LIMITS, string>;
export type ClientSettingsErrors = Partial<Record<keyof ClientSettingsValues, string>>;
export type ClientSettingsState = {
  values: ClientSettingsValues;
  errors: ClientSettingsErrors;
  message: string;
};
export type DeleteClientState = { message: string };

export function isClientId(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function validateClientSettings(formData: FormData): ClientSettingsState {
  const values = {} as ClientSettingsValues;
  const errors: ClientSettingsErrors = {};
  for (const field of Object.keys(CLIENT_SETTINGS_LIMITS) as (keyof ClientSettingsValues)[]) {
    const entries = formData.getAll(field);
    values[field] = typeof entries[0] === "string" ? entries[0].trim() : "";
    if (entries.length !== 1 || typeof entries[0] !== "string") {
      errors[field] = "Submit one text value for this field.";
    } else if (values[field].length > CLIENT_SETTINGS_LIMITS[field]) {
      errors[field] = `Use ${CLIENT_SETTINGS_LIMITS[field]} characters or fewer.`;
    } else if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(values[field])) {
      errors[field] = "Remove unsupported control characters.";
    }
  }
  if (!errors.name && !values.name) errors.name = "Enter a client name.";
  if (!errors.name && /[\r\n\t]/.test(values.name)) {
    errors.name = "Enter the client name on one line.";
  }
  if (!errors.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(values.slug)) {
    errors.slug = "Use lowercase letters or numbers, separated by single hyphens.";
  }
  if (!errors.slug && values.slug === "new") {
    errors.slug = "The slug new is reserved for creating workspaces. Choose another slug.";
  }
  if (!errors.accent && !Object.hasOwn(CLIENT_ACCENTS, values.accent)) {
    errors.accent = "Choose one of the available workspace colours.";
  }
  if (!errors.website_preview_url && values.website_preview_url) {
    try {
      const url = new URL(values.website_preview_url);
      if (!/^https:\/\//i.test(values.website_preview_url) ||
          url.protocol !== "https:" ||
          !url.hostname || url.username || url.password ||
          /[\s\\]/.test(values.website_preview_url)) {
        throw new Error("Invalid URL");
      }
    } catch {
      errors.website_preview_url = "Enter a full https:// URL without login credentials, or leave it blank.";
    }
  }
  return {
    values,
    errors,
    message: Object.keys(errors).length ? "Check the highlighted fields and try again." : "",
  };
}

export function databaseErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return undefined;
}
