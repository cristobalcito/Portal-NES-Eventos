const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

async function main() {
  const rut = '12345678-9';
  const email = 'gerente@nes-eventos.cl';
  const passwordPlana = 'admin123';
  const passwordHashed = await bcrypt.hash(passwordPlana, 10);

  // Crear usuario con su perfil de GerenteGeneral
  const usuario = await prisma.usuario.upsert({
    where: { rut },
    update: {},
    create: {
      rut,
      nombre: 'Gerente General',
      email,
      password: passwordHashed,
      gerenteGeneral: {
        create: {}, // Crea el registro en la tabla GerenteGeneral relacionada
      },
    },
  });

  console.log('Usuario Gerente creado:', usuario.rut);
}

main()
  .catch((e) => console.error('Error:', e))
  .finally(async () => await prisma.$disconnect());