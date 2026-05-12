const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5434,
  user: 'postgres',
  password: 'postgres',
  database: 'talent_db',
});

async function createCompanyProfile() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Company data
    const userId = '9f85bd2b-e6c5-4aca-97b1-0c6789999307'; // deivi.jimenez1@gmail.com
    const companyName = 'Talento Digital Solutions';
    const industry = 'Software Development';
    const website = 'https://www.talentodigital.com';

    // Insert company profile
    const result = await client.query(
      `INSERT INTO companies (id, "userId", name, industry, website) 
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       RETURNING id, "userId", name, industry, website;`,
      [userId, companyName, industry, website]
    );

    console.log('✅ Perfil de empresa registrado exitosamente:\n');
    const company = result.rows[0];
    console.log(`ID de Empresa: ${company.id}`);
    console.log(`ID de Usuario: ${company.userId}`);
    console.log(`Nombre: ${company.name}`);
    console.log(`Industria: ${company.industry}`);
    console.log(`Sitio Web: ${company.website}`);

    // Verify it was created
    console.log('\n--- VERIFICACIÓN ---\n');
    const verifyResult = await client.query(`
      SELECT c.id, c.name, c.industry, c.website, c."userId", u.email FROM companies c
      JOIN users u ON c."userId" = u.id
      WHERE c."userId" = $1;
    `, [userId]);

    if (verifyResult.rows.length > 0) {
      const verified = verifyResult.rows[0];
      console.log('✅ Perfil de empresa verificado:');
      console.log(`   Email del usuario: ${verified.email}`);
      console.log(`   Nombre de empresa: ${verified.name}`);
      console.log(`   Industria: ${verified.industry}`);
      console.log(`   Sitio web: ${verified.website}`);
    }

    await client.end();
    console.log('\n✅ Proceso completado');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createCompanyProfile();
