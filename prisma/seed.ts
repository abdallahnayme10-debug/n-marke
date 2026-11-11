import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CATEGORIES, REGIONS } from "../src/lib/constants";

const prisma = new PrismaClient();

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 86400 * 1000);
}

async function main() {
  console.log("🌴 Démarrage du seed N-marke...");

  // ── Période gratuite ──
  const launchDate = new Date();
  await prisma.setting.upsert({
    where: { key: "freePeriodEnd" },
    update: {},
    create: { key: "freePeriodEnd", value: daysFromNow(60).toISOString() },
  });
  await prisma.setting.upsert({
    where: { key: "launchDate" },
    update: {},
    create: { key: "launchDate", value: launchDate.toISOString() },
  });

  // ── Catégories ──
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const slug = cat.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
    const created = await prisma.category.upsert({
      where: { slug },
      update: { icon: cat.icon, sort: i },
      create: { name: cat.name, slug, icon: cat.icon, sort: i },
    });
    for (const sub of cat.sub) {
      const subSlug = sub.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
      await prisma.subcategory.upsert({
        where: { categoryId_slug: { categoryId: created.id, slug: subSlug } },
        update: {},
        create: { name: sub, slug: subSlug, categoryId: created.id },
      });
    }
  }

  // ── Utilisateur admin ──
  const admin = await prisma.user.upsert({
    where: { phone: "+2690000000" },
    update: { role: "admin", email: "admin@nmarke.com" },
    create: {
      name: "Équipe N-marke",
      phone: "+2690000000",
      email: "admin@nmarke.com",
      passwordHash: await bcrypt.hash("admin1234", 10),
      isVerified: true,
      role: "admin",
      island: "grande-comore",
      region: "Moroni",
      referralCode: "NMK-ADMIN",
    },
  });

  // ── Vendeur démo ──
  const seller = await prisma.user.upsert({
    where: { phone: "+2693200001" },
    update: { email: "fatima@nmarke.com" },
    create: {
      name: "Fatima",
      phone: "+2693200001",
      email: "fatima@nmarke.com",
      passwordHash: await bcrypt.hash("demo1234", 10),
      isVerified: true,
      island: "grande-comore",
      region: "Moroni",
      sellerTier: "premium",
      premiumUntil: daysFromNow(60),
      referralCode: "NMK-FATIMA",
      bio: "Je vends de jolis articles avec amour ❤️",
    },
  });

  // ── Livreurs démo ──
  const couriers = [
    { name: "Youssouf", phone: "+2693300001", region: "Moroni", availability: "temps plein" },
    { name: "Anziza", phone: "+2693300002", region: "Mitsamiouli", availability: "temps partiel" },
  ];
  for (const c of couriers) {
    await prisma.user.upsert({
      where: { phone: c.phone },
      update: { isCourier: true, role: "courier" },
      create: {
        name: c.name,
        phone: c.phone,
        passwordHash: await bcrypt.hash("demo1234", 10),
        isVerified: true,
        isCourier: true,
        role: "courier",
        island: "grande-comore",
        region: c.region,
        referralCode: `NMK-${c.name.toUpperCase()}`,
      },
    });
  }

  // ── Quelques annonces démo ──
  const categories = await prisma.category.findMany();
  const phonesCat = categories.find((c) => c.slug.includes("telephone"))!;
  const clothesCat = categories.find((c) => c.slug.includes("vetement"))!;
  const houseCat = categories.find((c) => c.slug.includes("maison"))!;

  const demoListings = [
    {
      title: "Téléphone Samsung Galaxy S21 5G",
      slug: "telephone-samsung-galaxy-s21",
      description: "Samsung Galaxy S21 en excellent état. 128 Go, couleur violet. Vendu avec son chargeur d'origine. Fonctionne parfaitement, aucune rayure.",
      price: 180000,
      type: "occasion",
      categoryId: phonesCat.id,
      brand: "Samsung",
      model: "Galaxy S21",
      quantity: 1,
      condition: "comme-neuf",
      island: "grande-comore",
      region: "Moroni",
      neighborhood: "Place Badjanani",
      deliveryAvailable: true,
      photos: JSON.stringify(["https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800"]),
      tags: JSON.stringify(["smartphone", "occasion", "original", "garantie"]),
      isFeatured: true,
      featuredUntil: daysFromNow(7),
    },
    {
      title: "Robe traditionnelle brodée",
      slug: "robe-traditionnelle-brodee",
      description: "Magnifique robe traditionnelle comorienne brodée à la main. Taille personnalisable. Idéale pour les grandes occasions.",
      price: 45000,
      type: "commande",
      categoryId: clothesCat.id,
      brand: "Fait main",
      quantity: 10,
      condition: "neuf",
      island: "grande-comore",
      region: "Mitsamiouli",
      deliveryAvailable: true,
      orderLeadTime: "5 à 7 jours",
      orderDeposit: true,
      orderDepositPct: 30,
      photos: JSON.stringify(["https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800"]),
      tags: JSON.stringify(["traditionnel", "fait main", "cadeau", "qualité"]),
      isFeatured: true,
      featuredUntil: daysFromNow(3),
    },
    {
      title: "Canapé 3 places confortable",
      slug: "canape-3-places-confortable",
      description: "Canapé 3 places très confortable, tissu gris clair. Vendu car déménagement. À venir chercher à Moroni, livraison possible.",
      price: 120000,
      type: "particulier",
      categoryId: houseCat.id,
      quantity: 1,
      condition: "bon-etat",
      island: "grande-comore",
      region: "Moroni",
      neighborhood: "Hamramba",
      deliveryAvailable: true,
      photos: JSON.stringify(["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"]),
      tags: JSON.stringify(["meuble", "occasion", "déménagement"]),
      expiresAt: daysFromNow(30),
    },
  ];

  for (const d of demoListings) {
    const existing = await prisma.listing.findUnique({ where: { slug: d.slug } });
    if (!existing) {
      const num = Math.floor(10000 + Math.random() * 90000);
      await prisma.listing.create({
        data: { ...d, sellerId: seller.id, articleNumber: `NMK-${num}` },
      });
    }
  }

  console.log("✅ Seed terminé !");
  console.log("👤 Admin  → tel +2690000000 / mot de passe admin1234");
  console.log("👤 Vendeur → tel +2693200001 / mot de passe demo1234");
  console.log("🔑 Note : en mode développement, les codes de confirmation EMAIL s'affichent dans les logs du serveur.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
