async function main() {
  const url = 'https://cryhojcfpzdtnnpamzwf.supabase.co';
  console.log(`Fetching headers from ${url}...`);
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log('Status:', res.status);
    console.log('Headers:');
    for (const [key, value] of res.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
  } catch (err) {
    console.error(err);
  }
}

main();
