import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Productos base del taller. Un Producto guarda solo su nombre: el precio se
// carga a mano en cada venta y por ahora no se controla cantidad.
const PRODUCTOS_BASE = [
  "Cámara de Auto",
  "Cámara de Moto",
  "Neumático de Auto",
  "Neumático de Moto",
];

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

  // Item.nombre no es único (un Servicio y un Producto podrían llamarse igual),
  // así que se busca antes de crear en vez de usar upsert.
  const categoriaProducto = await prisma.categoria.findUniqueOrThrow({
    where: { nombre: "Producto" },
  });
  for (const nombre of PRODUCTOS_BASE) {
    const existente = await prisma.item.findFirst({
      where: { nombre, id_categoria: categoriaProducto.id_categoria },
    });
    if (!existente) {
      await prisma.item.create({
        data: { nombre, id_categoria: categoriaProducto.id_categoria },
      });
    }
  }

  console.log("Seed completo: categorías, métodos de pago y productos base.");
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
