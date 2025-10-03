let borzoToken: string | null = null;

// Get Borzo token
export const getBorzoToken = (): string => {
  if (!borzoToken) {
    if (!process.env.BORZO_TOKEN) {
      throw new Error("Borzo token not set in environment variables");
    }
    borzoToken = process.env.BORZO_TOKEN;
  }
  return borzoToken;
};

// Optional: update token if you ever rotate it
export const setBorzoToken = (token: string) => {
  borzoToken = token;
};
