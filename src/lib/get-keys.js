const { Client } = require('pg');
const crypto = require('crypto');

const client = new Client({
  connectionString: 'postgresql://postgres.cryhojcfpzdtnnpamzwf:6UcKzGB7fLniLE6U@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

function base64url(str) {
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerEncoded = base64url(JSON.stringify(header));
  const payloadEncoded = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret)
                          .update(`${headerEncoded}.${payloadEncoded}`)
                          .digest('base64')
                          .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

async function main() {
  await client.connect();
  try {
    const res = await client.query(`SELECT current_setting('app.settings.jwt_secret', true) as secret`);
    const secret = res.rows[0].secret;
    console.log('JWT Secret:', secret);

    if (secret) {
      const anonPayload = { role: 'anon', iss: 'supabase', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 10 };
      const anonKey = signJWT(anonPayload, secret);
      console.log('Generated anon key:', anonKey);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}
main();
