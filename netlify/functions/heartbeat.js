async function getConfig(supabaseUrl, headers) {
  const response = await fetch(supabaseUrl + "/rest/v1/game_config?select=*", {
    headers,
  });

  const rows = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(rows));
  }

  const map = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }

  return map;
}

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({
          ok: false,
          error: "Method not allowed",
        }),
      };
    }

    const body = JSON.parse(event.body || "{}");

    if (body.secret !== process.env.ROBLOX_SECRET) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          ok: false,
          error: "Unauthorized",
        }),
      };
    }

    const players = Number(body.players || 0);
    const servers = Number(body.servers || 1);
    const jobId = String(body.jobId || "");
    const serverStartMs = Number(body.serverStartMs || 0);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const headers = {
      apikey: supabaseKey,
      Authorization: "Bearer " + supabaseKey,
    };

    const statsResponse = await fetch(supabaseUrl + "/rest/v1/game_stats", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        players,
        servers,
      }),
    });

    const statsResult = await statsResponse.json();

    if (!statsResponse.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          ok: false,
          error: JSON.stringify(statsResult),
        }),
      };
    }

    const now = Date.now();
    const configMap = await getConfig(supabaseUrl, headers);

    const rawEnabled = configMap.summit_event_enabled === "true";
    const summitEventEndsAt = Number(configMap.summit_event_ends_at || 0);
    const eventStillActive =
      rawEnabled && summitEventEndsAt > 0 && summitEventEndsAt > now;

    const summitMultiplier = Number(configMap.summit_multiplier || 1);
    const summitEventName = configMap.summit_event_name || "Normal Summit";
    const remainingMs = eventStillActive
      ? Math.max(0, summitEventEndsAt - now)
      : 0;

    const resetAllId = configMap.reset_all_id || "";
    const resetAllReason =
      configMap.reset_all_reason || "Server sedang di-reset oleh admin.";
    const resetAllCreatedAt = Number(configMap.reset_all_created_at || 0);

    let command = null;

    if (
      resetAllId &&
      resetAllCreatedAt > 0 &&
      serverStartMs > 0 &&
      resetAllCreatedAt > serverStartMs
    ) {
      command = {
        id: resetAllId,
        type: "reset_all",
        reason: resetAllReason,
        createdAt: resetAllCreatedAt,
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        players,
        servers,
        jobId,
        serverTimeMs: now,
        config: {
          summitEventEnabled: eventStillActive,
          summitMultiplier: eventStillActive ? summitMultiplier : 1,
          summitEventName: eventStillActive ? summitEventName : "Normal Summit",
          summitEventEndsAt,
          remainingMs,
        },
        command,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: String(err),
      }),
    };
  }
};
