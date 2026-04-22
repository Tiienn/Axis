import PostHog from 'posthog-react-native';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

let client: PostHog | null = null;

export function initAnalytics() {
  if (!apiKey || client) return;
  client = new PostHog(apiKey, { host });
}

type Props = Record<string, string | number | boolean | null>;

export function track(event: string, props?: Props) {
  if (!client) return;
  client.capture(event, props);
}

export function identify(userId: string, props?: Props) {
  if (!client) return;
  client.identify(userId, props);
}

export function resetAnalytics() {
  if (!client) return;
  client.reset();
}
