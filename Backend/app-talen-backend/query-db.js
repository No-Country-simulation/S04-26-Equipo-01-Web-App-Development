const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5434,
  user: 'postgres',
  password: 'postgres',
  database: 'talent_db',
});

async function queryDatabase() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Query users
    console.log('=== USUARIOS REGISTRADOS ===\n');
    const usersResult = await client.query(`
      SELECT id, email, role, "createdAt", "updatedAt" FROM users ORDER BY "createdAt" DESC;
    `);
    
    if (usersResult.rows.length === 0) {
      console.log('No hay usuarios registrados');
    } else {
      console.log(`Total de usuarios: ${usersResult.rows.length}\n`);
      usersResult.rows.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Rol: ${user.role}`);
        console.log(`   Creado: ${user.createdAt}`);
        console.log('');
      });
    }

    // Query companies
    console.log('\n=== EMPRESAS REGISTRADAS ===\n');
    const companiesResult = await client.query(`
      SELECT c.id, c.name, c.industry, c.website, c."userId", u.email FROM companies c
      JOIN users u ON c."userId" = u.id
      ORDER BY c.id DESC;
    `);
    
    if (companiesResult.rows.length === 0) {
      console.log('No hay empresas registradas');
    } else {
      console.log(`Total de empresas: ${companiesResult.rows.length}\n`);
      companiesResult.rows.forEach((company, index) => {
        console.log(`${index + 1}. Nombre: ${company.name}`);
        console.log(`   ID: ${company.id}`);
        console.log(`   Email asociado: ${company.email}`);
        console.log(`   Industria: ${company.industry || 'No especificada'}`);
        console.log(`   Sitio web: ${company.website || 'No especificado'}`);
        console.log('');
      });
    }

    // Query profiles (talentos)
    console.log('\n=== PERFILES DE TALENTO ===\n');
    const profilesResult = await client.query(`
      SELECT p.id, p."fullName", p.location, p.headline, p."yearsExperience", p."employabilityScore", u.email, u."createdAt" FROM profiles p
      JOIN users u ON p."userId" = u.id
      ORDER BY u."createdAt" DESC;
    `);
    
    if (profilesResult.rows.length === 0) {
      console.log('No hay perfiles de talento registrados');
    } else {
      console.log(`Total de talentos: ${profilesResult.rows.length}\n`);
      profilesResult.rows.forEach((profile, index) => {
        console.log(`${index + 1}. Nombre: ${profile.fullName}`);
        console.log(`   Email: ${profile.email}`);
        console.log(`   Titular: ${profile.headline || 'No especificado'}`);
        console.log(`   Ubicación: ${profile.location || 'No especificada'}`);
        console.log(`   Años de experiencia: ${profile.yearsExperience || 'No especificados'}`);
        console.log(`   Score de empleabilidad: ${profile.employabilityScore || 0}`);
        console.log(`   Registrado: ${profile.createdAt}`);
        console.log('');
      });
    }

    await client.end();
    console.log('✅ Consulta completada');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

queryDatabase();
