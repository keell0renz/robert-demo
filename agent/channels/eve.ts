import { eveChannel } from "eve/channels/eve";
import { none } from "eve/channels/auth";

// The built-in HTTP channel that serves /eve/v1/*. This is a public demo, so
// every request is accepted anonymously via `none()`. Swap back to
// `[vercelOidc(), localDev()]` (or your own app auth) before handling any
// non-public data. See https://eve.dev/docs/guides/auth-and-route-protection
export default eveChannel({ auth: [none()] });
