import { isLoggedIn, postGodmodeActivation } from "../services/auth-api";

const LS_GODMODE_TS = "stumpdpuzzle_hmChampionTs";
const GODMODE_DURATION_MS = 24 * 60 * 60 * 1000;

/** Fast synchronous check using localStorage cache. */
export function isGodmodeActive(): boolean {
  if (typeof window === "undefined") return false;
  const loggedIn = isLoggedIn();
  if (!loggedIn) {
    // #region agent log
    fetch('http://127.0.0.1:7615/ingest/c641f394-8238-49b5-9ef6-2a0c0c5d4763',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'327401'},body:JSON.stringify({sessionId:'327401',location:'godmode-status.ts:isGodmodeActive',message:'not logged in',data:{loggedIn,hasToken:!!localStorage.getItem('stumpd_auth_token')},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return false;
  }
  try {
    const ts = localStorage.getItem(LS_GODMODE_TS);
    if (!ts) {
      // #region agent log
      fetch('http://127.0.0.1:7615/ingest/c641f394-8238-49b5-9ef6-2a0c0c5d4763',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'327401'},body:JSON.stringify({sessionId:'327401',location:'godmode-status.ts:isGodmodeActive',message:'no godmode timestamp',data:{ts:null},timestamp:Date.now(),hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      return false;
    }
    const elapsed = Date.now() - Number(ts);
    const active = elapsed < GODMODE_DURATION_MS;
    // #region agent log
    fetch('http://127.0.0.1:7615/ingest/c641f394-8238-49b5-9ef6-2a0c0c5d4763',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'327401'},body:JSON.stringify({sessionId:'327401',location:'godmode-status.ts:isGodmodeActive',message:'timestamp check',data:{ts,elapsed,active,durationMs:GODMODE_DURATION_MS},timestamp:Date.now(),hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    return active;
  } catch {
    return false;
  }
}

/** Ask the server to activate godmode. Only writes localStorage on server confirmation. */
export async function activateGodmode(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const result = await postGodmodeActivation();
  return result.success;
}

export function getGodmodeHoursRemaining(): number {
  if (typeof window === "undefined") return 0;
  try {
    const ts = Number(localStorage.getItem(LS_GODMODE_TS) ?? 0);
    const remaining = GODMODE_DURATION_MS - (Date.now() - ts);
    return Math.max(0, Math.ceil(remaining / (60 * 60 * 1000)));
  } catch {
    return 0;
  }
}
