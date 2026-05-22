exports.handler = async function () {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const headers = {
      apikey: supabaseKey,
      Authorization: "Bearer " + supabaseKey,
    };

    const statsUrl =
      supabaseUrl +
      "/rest/v1/game_stats?select=*&order=created_at.desc&limit=1";

    const configUrl =
      supabaseUrl +
      "/rest/v1/game_config?select=*";

    const [statsResponse, configResponse] = await Promise.all([
      fetch(statsUrl, { headers }),
      fetch(configUrl, { headers }),
    ]);

    const statsRows = await statsResponse.json();
    const configRows = await configResponse.json();

    if (!statsResponse.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          ok: false,
          error: JSON.stringify(statsRows),
        }),
      };
    }

    if (!configResponse.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          ok: false,
          error: JSON.stringify(configRows),
        }),
      };
    }

    const latest = statsRows[0] || {
      players: 0,
      servers: 0,
      created_at: null,
    };

    const configMap = {};
    for (const row of configRows) {
      configMap[row.key] = row.value;
    }

    const now = Date.now();

    const rawEnabled = configMap.summit_event_enabled === "true";
    const summitEventEndsAt = Number(configMap.summit_event_ends_at || 0);
    const eventStillActive =
      rawEnabled && summitEventEndsAt > 0 && summitEventEndsAt > now;

    const summitMultiplier = Number(configMap.summit_multiplier || 1);
    const summitEventName = configMap.summit_event_name || "Normal Summit";
    const remainingMs = eventStillActive
      ? Math.max(0, summitEventEndsAt - now)
      : 0;

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        players: latest.players,
        servers: latest.servers,
        created_at: latest.created_at,
        serverTimeMs: now,
        config: {
          summitEventEnabled: eventStillActive,
          summitMultiplier: eventStillActive ? summitMultiplier : 1,
          summitEventName: eventStillActive ? summitEventName : "Normal Summit",
          summitEventEndsAt,
          remainingMs,
        },
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
