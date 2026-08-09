import { assertClerkE2eEnv } from "./helpers/clerk";

/**
 * Clerk の Testing Token 初期化（clerkSetup）は worker 側（ensureClerkWorkerSetup）で行う。
 * globalSetup は function-based のためトークンが worker に届かず、二重 clerkSetup も避ける。
 */
export default async function globalSetup() {
  assertClerkE2eEnv();
}
