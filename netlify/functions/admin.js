function makeId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 999999);
}

async function upsertConfig(supabaseUrl, headers, rows) {
  const response = await fetch(
    supabaseUrl + "/rest/v1/game_config?on_conflict=key",
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(rows),
    }
  );

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(JSON.stringify(result));
  }

  return result;
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

    if (String(body.pin || "") !== String(process.env.ADMIN_PIN || "")) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          ok: false,
          error: "PIN admin salah.",
        }),
      };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const headers = {
      apikey: supabaseKey,
      Authorization: "Bearer " + supabaseKey,
    };

    if (body.action === "set_event") {
      const enabled = body.enabled === true || String(body.enabled) === "true";

      let multiplier = Number(body.multiplier || 1);
      if (!multiplier || multiplier < 1) multiplier = 1;
      if (multiplier > 20) multiplier = 20;

      let eventName = String(body.eventName || "Summit Boost");
      eventName = eventName.slice(0, 40);

      await upsertConfig(supabaseUrl, headers, [
        {
          key: "summit_event_enabled",
          value: enabled ? "true" : "false",
        },
        {
          key: "summit_multiplier",
          value: String(multiplier),
        },
        {
          key: "summit_event_name",
          value: eventName,
        },
      ]);

      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          message: "Summit event updated.",
          config: {
            summitEventEnabled: enabled,
            summitMultiplier: multiplier,
            summitEventName: eventName,
          },
        }),
      };
    }

    if (body.action === "reset_all") {
      const now = Date.now();
      const commandId = makeId("reset_all");
      const reason =
        String(body.reason || "Server sedang di-reset oleh admin.").slice(
          0,
          120
        );

      await upsertConfig(supabaseUrl, headers, [
        {
          key: "reset_all_id",
          value: commandId,
        },
        {
          key: "reset_all_reason",
          value: reason,
        },
        {
          key: "reset_all_created_at",
          value: String(now),
        },
      ]);

      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          message: "Reset all server command sent.",
          command: {
            id: commandId,
            type: "reset_all",
            reason,
            createdAt: now,
          },
        }),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({
        ok: false,
        error: "Unknown action.",
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
