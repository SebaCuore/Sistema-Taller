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
    ["Efectivo", "Transferencia"].map((nombre) =>
      prisma.metodoPago.upsert({
        where: { nombre },
        update: {},
        create: { nombre },
      })
    )
  );
  // Tarjeta se deshabilitó como método de pago (queda desactivada, no se borra,
  // por si hay ventas viejas que la referencian).
  await prisma.metodoPago.upsert({
    where: { nombre: "Tarjeta" },
    update: {},
    create: { nombre: "Tarjeta", activo: false },
  });

  console.log("Seed completo: categorías y métodos de pago base.");
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
