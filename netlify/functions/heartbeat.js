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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const response = await fetch(supabaseUrl + "/rest/v1/game_stats", {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: "Bearer " + supabaseKey,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        players,
        servers,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          ok: false,
          error: JSON.stringify(result),
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        players,
        servers,
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
