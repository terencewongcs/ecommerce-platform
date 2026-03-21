import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../src/lib/env.js";
import { User } from "../src/models/User.js";
import { Product } from "../src/models/Product.js";
import bcrypt from "bcrypt";

// ── Sample products ───────────────────────────────────────────────────────────

const PRODUCTS = [
  // Women
  {
    slug: "floral-wrap-dress",
    name: "Floral Wrap Dress",
    brand: "Zara",
    description: "A lightweight floral wrap dress perfect for spring outings. Features a V-neckline and adjustable waist tie.",
    price: 59.99,
    originalPrice: 89.99,
    images: ["https://placehold.co/600x800?text=Floral+Wrap+Dress"],
    stock: 42,
    category: ["women", "sale"],
    sizes: ["XS", "S", "M", "L", "XL"],
    tag: "Sale",
    isPublished: true,
  },
  {
    slug: "ribbed-turtleneck-sweater",
    name: "Ribbed Turtleneck Sweater",
    brand: "COS",
    description: "A cozy ribbed turtleneck sweater crafted from a soft cotton-wool blend. Relaxed silhouette for effortless layering.",
    price: 79.00,
    images: ["https://placehold.co/600x800?text=Turtleneck+Sweater"],
    stock: 30,
    category: ["women", "new-arrivals"],
    sizes: ["XS", "S", "M", "L"],
    tag: "New",
    isPublished: true,
  },
  {
    slug: "wide-leg-linen-trousers",
    name: "Wide Leg Linen Trousers",
    brand: "& Other Stories",
    description: "Breezy wide-leg trousers in breathable linen. High waist with an elastic back for all-day comfort.",
    price: 95.00,
    images: ["https://placehold.co/600x800?text=Linen+Trousers"],
    stock: 18,
    category: ["women"],
    sizes: ["XS", "S", "M", "L", "XL"],
    tag: "Bestseller",
    isPublished: true,
  },
  {
    slug: "oversized-denim-jacket",
    name: "Oversized Denim Jacket",
    brand: "Levi's",
    description: "A classic oversized denim jacket with a vintage wash. Four-pocket styling and contrast stitching.",
    price: 110.00,
    images: ["https://placehold.co/600x800?text=Denim+Jacket"],
    stock: 25,
    category: ["women"],
    sizes: ["S", "M", "L", "XL"],
    tag: null,
    isPublished: true,
  },
  // Men
  {
    slug: "slim-fit-chinos",
    name: "Slim Fit Chinos",
    brand: "J.Crew",
    description: "Versatile slim-fit chinos made from stretch cotton. Ideal for smart-casual looks.",
    price: 69.50,
    images: ["https://placehold.co/600x800?text=Slim+Chinos"],
    stock: 60,
    category: ["men"],
    sizes: ["28", "30", "32", "34", "36"],
    tag: "Bestseller",
    isPublished: true,
  },
  {
    slug: "merino-crewneck-sweater",
    name: "Merino Crewneck Sweater",
    brand: "Uniqlo",
    description: "Fine-knit merino wool crewneck in a relaxed fit. Naturally temperature-regulating and itch-free.",
    price: 49.90,
    images: ["https://placehold.co/600x800?text=Merino+Crewneck"],
    stock: 55,
    category: ["men", "new-arrivals"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    tag: "New",
    isPublished: true,
  },
  {
    slug: "oxford-button-down-shirt",
    name: "Oxford Button-Down Shirt",
    brand: "Ralph Lauren",
    description: "A timeless Oxford cloth button-down shirt. Chest pocket and signature embroidered logo.",
    price: 89.00,
    images: ["https://placehold.co/600x800?text=Oxford+Shirt"],
    stock: 40,
    category: ["men"],
    sizes: ["S", "M", "L", "XL"],
    tag: null,
    isPublished: true,
  },
  {
    slug: "cargo-jogger-pants",
    name: "Cargo Jogger Pants",
    brand: "Carhartt WIP",
    description: "Relaxed cargo joggers with multiple utility pockets and an elasticated cuff. Durable ripstop fabric.",
    price: 120.00,
    originalPrice: 150.00,
    images: ["https://placehold.co/600x800?text=Cargo+Joggers"],
    stock: 22,
    category: ["men", "sale"],
    sizes: ["S", "M", "L", "XL"],
    tag: "Sale",
    isPublished: true,
  },
  // Accessories
  {
    slug: "leather-tote-bag",
    name: "Leather Tote Bag",
    brand: "Toteme",
    description: "A structured tote in full-grain leather. Spacious interior with zip pocket and magnetic snap closure.",
    price: 320.00,
    images: ["https://placehold.co/600x800?text=Leather+Tote"],
    stock: 10,
    category: ["accessories"],
    sizes: ["One Size"],
    tag: "Bestseller",
    isPublished: true,
  },
  {
    slug: "wool-blend-scarf",
    name: "Wool Blend Scarf",
    brand: "Acne Studios",
    description: "A generously sized scarf in a wool-mohair blend. Fringe trim on both ends.",
    price: 180.00,
    originalPrice: 230.00,
    images: ["https://placehold.co/600x800?text=Wool+Scarf"],
    stock: 15,
    category: ["accessories", "sale"],
    sizes: ["One Size"],
    tag: "Sale",
    isPublished: true,
  },
  {
    slug: "tortoise-sunglasses",
    name: "Tortoise Shell Sunglasses",
    brand: "Le Specs",
    description: "Round tortoise shell frames with UV400 polarised lenses. Lightweight and durable acetate construction.",
    price: 65.00,
    images: ["https://placehold.co/600x800?text=Sunglasses"],
    stock: 35,
    category: ["accessories", "new-arrivals"],
    sizes: ["One Size"],
    tag: "New",
    isPublished: true,
  },
  {
    slug: "canvas-baseball-cap",
    name: "Canvas Baseball Cap",
    brand: "Carhartt WIP",
    description: "Six-panel baseball cap in washed canvas. Adjustable strapback with metal buckle.",
    price: 35.00,
    images: ["https://placehold.co/600x800?text=Baseball+Cap"],
    stock: 80,
    category: ["accessories"],
    sizes: ["One Size"],
    tag: null,
    isPublished: true,
  },
];

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("MongoDB connected");

  // Find or create a seed admin user to use as vendorId
  let admin = await User.findOne({ email: "admin@trendyunique.com" });
  if (!admin) {
    const passwordHash = await bcrypt.hash("Admin1234!", 12);
    admin = await User.create({
      email: "admin@trendyunique.com",
      passwordHash,
      firstName: "Admin",
      lastName: "TrendyUnique",
      role: "admin",
    });
    console.log("Created admin user: admin@trendyunique.com / Admin1234!");
  } else {
    console.log("Admin user already exists, skipping creation");
  }

  const vendorId = admin._id;

  // Insert products, skip duplicates (by slug)
  let inserted = 0;
  let skipped = 0;

  for (const data of PRODUCTS) {
    const exists = await Product.findOne({ slug: data.slug });
    if (exists) {
      console.log(`  ⚠ Skip (already exists): ${data.slug}`);
      skipped++;
      continue;
    }
    await Product.create({ ...data, vendorId });
    console.log(`  ✓ Inserted: ${data.name}`);
    inserted++;
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
