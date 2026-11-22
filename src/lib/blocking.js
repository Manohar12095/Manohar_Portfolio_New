/**
 * Access Control & Visitor Blocking Engine
 * Allows Super User to block, terminate, and enforce temporary or permanent bans
 * across all portfolio visitors and users.
 */
import { getAdapter } from "../data/store";
import { getOrCreateSessionId, getStoredVisitorName } from "./telemetry";

export const BLOCK_DURATIONS = [
  { id: "terminate", label: "⚡ Terminate Session (Immediate Kickout - 5m)", ms: 5 * 60 * 1000 },
  { id: "5m", label: "⏱️ 5 Minutes Temporary Block", ms: 5 * 60 * 1000 },
  { id: "1h", label: "⏱️ 1 Hour Temporary Block", ms: 60 * 60 * 1000 },
  { id: "12h", label: "⏱️ 12 Hours Temporary Block", ms: 12 * 60 * 60 * 1000 },
  { id: "1d", label: "⏱️ 1 Day (24 Hours) Block", ms: 24 * 60 * 60 * 1000 },
  { id: "1w", label: "⏱️ 1 Week Block", ms: 7 * 24 * 60 * 60 * 1000 },
  { id: "1mo", label: "⏱️ 1 Month Block", ms: 30 * 24 * 60 * 60 * 1000 },
  { id: "6mo", label: "⏱️ 6 Months Block", ms: 180 * 24 * 60 * 60 * 1000 },
  { id: "1y", label: "⏱️ 1 Year Block", ms: 365 * 24 * 60 * 60 * 1000 },
  { id: "permanent", label: "🚫 Permanent Ban (Indefinite)", ms: null },
];

/**
 * Calculates the exact ISO timestamp until which the visitor is blocked
 */
export function calculateBlockedUntil(durationType) {
  const item = BLOCK_DURATIONS.find((d) => d.id === durationType);
  if (!item || item.ms === null || durationType === "permanent") {
    // 100 years in future for permanent
    return new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
  }
  return new Date(Date.now() + item.ms).toISOString();
}

/**
 * Checks if the current visitor or user session is blocked
 */
export async function checkVisitorBlockStatus() {
  const sessionId = getOrCreateSessionId();
  const visitorName = getStoredVisitorName();
  const adapter = getAdapter();
  const supabase = adapter?.supabase;

  if (!supabase) return { isBlocked: false, blockData: null };

  try {
    // Query active blocks matching current session_id or visitor_name
    let query = supabase
      .from("visitor_blocks")
      .select("*")
      .eq("is_active", true);

    if (visitorName && visitorName.trim().length > 1) {
      query = query.or(`session_id.eq.${sessionId},visitor_name.eq.${visitorName.trim()}`);
    } else {
      query = query.eq("session_id", sessionId);
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(1);

    if (error) {
      console.warn("Error checking visitor block status:", error.message);
      return { isBlocked: false, blockData: null };
    }

    if (!data || data.length === 0) {
      return { isBlocked: false, blockData: null };
    }

    const block = data[0];
    const now = new Date();
    const blockedUntil = block.blocked_until ? new Date(block.blocked_until) : null;

    // Check if temporary block has expired
    if (blockedUntil && blockedUntil <= now) {
      // Auto deactivate expired block in background
      supabase
        .from("visitor_blocks")
        .update({ is_active: false, updated_at: now.toISOString() })
        .eq("id", block.id)
        .then(() => {});

      return { isBlocked: false, blockData: null };
    }

    return {
      isBlocked: true,
      blockData: block,
    };
  } catch (err) {
    console.warn("Exception checking visitor block status:", err);
    return { isBlocked: false, blockData: null };
  }
}

/**
 * Super User action: Block a visitor or admin account
 */
export async function enforceVisitorBlock({
  sessionId = null,
  visitorName = null,
  email = null,
  durationType = "1d",
  reason = "Administrative security restriction",
  blockedBy = "Super User",
}) {
  const adapter = getAdapter();
  const supabase = adapter?.supabase;
  if (!supabase) throw new Error("Database connection not available.");

  const blockedUntil = calculateBlockedUntil(durationType);
  const now = new Date().toISOString();

  // 1. Insert row into visitor_blocks
  const { data: blockRow, error: blockErr } = await supabase
    .from("visitor_blocks")
    .insert([
      {
        session_id: sessionId || null,
        visitor_name: visitorName || null,
        duration_type: durationType,
        blocked_until: blockedUntil,
        reason: reason || "Administrative security restriction",
        blocked_by: blockedBy,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ])
    .select()
    .single();

  if (blockErr) throw blockErr;

  // 2. Update visitor_telemetry if sessionId or visitorName exists
  if (sessionId || visitorName) {
    let q = supabase
      .from("visitor_telemetry")
      .update({
        is_blocked: true,
        blocked_until: blockedUntil,
        block_reason: reason,
        threat_level: "critical",
        last_active_at: now,
      });

    if (sessionId) {
      q = q.eq("session_id", sessionId);
    } else if (visitorName) {
      q = q.eq("visitor_name", visitorName);
    }

    await q;
  }

  // 3. Update admin_roles if email exists
  if (email) {
    await supabase
      .from("admin_roles")
      .update({
        is_blocked: true,
        blocked_until: blockedUntil,
        block_reason: reason,
        updated_at: now,
      })
      .eq("email", email);
  }

  return blockRow;
}

/**
 * Super User action: Unblock a visitor or admin account
 */
export async function releaseVisitorBlock({ sessionId = null, visitorName = null, email = null }) {
  const adapter = getAdapter();
  const supabase = adapter?.supabase;
  if (!supabase) throw new Error("Database connection not available.");

  const now = new Date().toISOString();

  // 1. Deactivate in visitor_blocks
  if (sessionId) {
    await supabase
      .from("visitor_blocks")
      .update({ is_active: false, updated_at: now })
      .eq("session_id", sessionId);
  }
  if (visitorName) {
    await supabase
      .from("visitor_blocks")
      .update({ is_active: false, updated_at: now })
      .eq("visitor_name", visitorName);
  }

  // 2. Clear flags in visitor_telemetry
  if (sessionId) {
    await supabase
      .from("visitor_telemetry")
      .update({
        is_blocked: false,
        blocked_until: null,
        block_reason: null,
        last_active_at: now,
      })
      .eq("session_id", sessionId);
  } else if (visitorName) {
    await supabase
      .from("visitor_telemetry")
      .update({
        is_blocked: false,
        blocked_until: null,
        block_reason: null,
        last_active_at: now,
      })
      .eq("visitor_name", visitorName);
  }

  // 3. Clear flags in admin_roles if email provided
  if (email) {
    await supabase
      .from("admin_roles")
      .update({
        is_blocked: false,
        blocked_until: null,
        block_reason: null,
        updated_at: now,
      })
      .eq("email", email);
  }

  return true;
}

