// Supabase Edge Function per fare proxy alle API Replit
// Questo evita problemi CORS chiamando Replit server-side

const REPLIT_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjB1a2x0QSJ9.eyJpc3MiOiJodHRwczovL3Nlc3Npb24uZmlyZWJhc2UuZ29vZ2xlLmNvbS9yZXBsaXQtd2ViIiwibmFtZSI6InRvb2xzIHdhc2FiaSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMZVVsYlA4QXpuTDFTSzNybE1rWFFFY3B1bDd2WFNxNmVVelNFQVFOSEN1T1k5bkFcdTAwM2RzOTYtYyIsImF1ZCI6InJlcGxpdC13ZWIiLCJhdXRoX3RpbWUiOjE3NjgyNDE0ODMsInVzZXJfaWQiOiJlTW5ydGJMNDJPYjdUcGxBdXY2UlFaTDdZMmwyIiwic3ViIjoiZU1ucnRiTDQyT2I3VHBsQXV2NlJRWkw3WTJsMiIsImlhdCI6MTc2ODQyMzg0NiwiZXhwIjoxNzY5MDI4NjQ2LCJlbWFpbCI6InRvb2xzQHdhc2FiaW9mZmVycy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExMzIyODQ0MjE5ODM5NjUyMDEzNiJdLCJlbWFpbCI6WyJ0b29sc0B3YXNhYmlvZmZlcnMuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.lyAUObZN9rgzxmnk_z_2bDe920kCxhcPoC9kr6q5RxXhqn7c4r2r0fvcqWbO5d9uU0OfaswvWZE5RO6JxenRgW68KuIf2lspxe-NnaRBUFazuoM7j3BZ4y_PEnY6YRpsTe5NwD0tH4bL4x3LObcaWqO5jxP_ZssU6PyZNf8VoLloEmQo0ILm8RYAwO2sySFyT3wx3w5gK79xQI9IOJsBg5CxBhCzlbJ7pNgD6AT8EQhnHFIaT85BsFUR4BRP8yE_2Mysxsp9Qq6QUafrln2-55PD0OafQ7OJHY4NZOslHD_gPXVEMWgMCBRyh6vsKWpo4gUqv2PW_iLNskkRv7xddg';

Deno.serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Leggi il body della richiesta (GraphQL query)
    const body = await req.json();

    console.log('📤 Forwarding request to Replit GraphQL API');

    // Inoltra la richiesta a Replit
    const response = await fetch('https://replit.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${REPLIT_TOKEN}`,
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log('✅ Response from Replit:', response.status);

    // Ritorna la risposta al client
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('❌ Error:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to proxy request to Replit API',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
