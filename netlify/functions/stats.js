exports.handler = async function () {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const url =
      supabaseUrl +
      "/rest/v1/game_stats?select=*&order=created_at.desc&limit=1";

    const response = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: "Bearer " + supabaseKey,
      },
    });

    const rows = await response.json();

    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          ok: false,
          error: JSON.stringify(rows),
        }),
      };
    }

    const latest = rows[0] || {
      players: 0,
      servers: 0,
      created_at: null,
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        players: latest.players,
        servers: latest.servers,
        created_at: latest.created_at,
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
