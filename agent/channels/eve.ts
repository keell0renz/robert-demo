import { eveChannel } from "eve/channels/eve";
import { localDev, vercelOidc } from "eve/channels/auth";

// The built-in HTTP channel that serves /eve/v1/*. This mirrors eve's default
// fail-closed policy: Vercel OIDC callers first, then open localhost in dev,
// everything else 401s. Swap in `none()` for a fully public demo, or your own
// app auth here. See https://eve.dev/docs/guides/auth-and-route-protection
export default eveChannel({ auth: [vercelOidc(), localDev()] });
