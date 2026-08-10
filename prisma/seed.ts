import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await Promise.all(
    ["Servicio", "Producto"].map((nombre) =>
      prisma.categoria.upsert({
        where: { nombre },
        update: {},
        create: { nombre },
      })
    )
  );

  await Promise.all(
    ["Efectivo", "Transferencia", "Tarjeta"].map((nombre) =>
      prisma.metodoPago.upsert({
        where: { nombre },
        update: {},
        create: { nombre },
      })
    )
  );

  const medidas = ["R13", "R14", "R15", "R16", "2.75-18", "3.00-18"];
  await Promise.all(
    medidas.map((codigo) =>
      prisma.medida.upsert({
        where: { codigo },
        update: {},
        create: { codigo },
      })
    )
  );

  console.log("Seed completo: categorías, métodos de pago y medidas base.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
