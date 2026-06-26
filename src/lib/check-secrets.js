const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:6UcKzGB7fLniLE6U@db.cryhojcfpzdtnnpamzwf.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();
  try {
    const schemas = await client.query(`
      SELECT schema_name FROM information_schema.schemata;
    `);
    console.log('Schemas:', schemas.rows.map(r => r.schema_name));

    const vaultSecrets = await client.query(`
      SELECT * FROM vault.secrets;
    `).catch(e => ({ error: e.message }));
    console.log('Vault secrets:', vaultSecrets.rows || vaultSecrets.error);

    const decryptedSecrets = await client.query(`
      SELECT * FROM vault.decrypted_secrets;
    `).catch(e => ({ error: e.message }));
    console.log('Decrypted secrets:', decryptedSecrets.rows || decryptedSecrets.error);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
