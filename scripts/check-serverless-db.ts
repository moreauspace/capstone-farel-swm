process.env.AWS_LAMBDA_FUNCTION_NAME = "netlify-check";

async function main() {
  const { prisma } = await import("../lib/prisma");
  const count = await prisma.user.count();
  const admin = await prisma.user.findUnique({ where: { username: "superadmin" } });
  if (count < 8 || !admin) throw new Error(`Database demo tidak lengkap: ${count} pengguna`);
  console.log(`Database serverless terbaca: ${count} pengguna, termasuk ${admin.username}.`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
