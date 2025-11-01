export const extractBasicApiKey = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader || !authorizationHeader.startsWith('Basic ')) {
    return null;
  }

  try {
    const base64Credentials = authorizationHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [apiKey] = credentials.split(':');

    return apiKey || null;
  } catch {
    return null;
  }
};
