
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Creating Amazon-style variant family...')

  // 0. Create a Category if not exists
  let category = await prisma.category.findFirst()
  if (!category) {
      category = await prisma.category.create({
          data: {
              name: "Clothing",
              slug: "clothing-" + Date.now(),
              description: "Apparel and more"
          }
      })
  }

  // 1. Create the Parent Product (Virtual container)
  const parent = await prisma.product.create({
    data: {
      title: "Classic Cotton T-Shirt (Parent)",
      slug: "classic-cotton-t-shirt-family-" + Date.now(),
      description: "<p>This is the parent product container.</p>",
      price: 0,
      amazonUrl: "#",
      mainImage: "/uploads/placeholder.jpg", // Placeholder
      images: "[]",
      bulletPoints: "[]",
      categoryId: category.id,
      active: true,
      showBuyOnAmazon: false,
      showAddToCart: false,
    }
  })

  console.log(`Created Parent: ${parent.id}`)

  // 2. Create Child Variant 1 (Red)
  const redShirt = await prisma.product.create({
    data: {
      title: "Classic Cotton T-Shirt - Red",
      slug: "classic-cotton-t-shirt-red-" + Date.now(),
      description: "<p>A beautiful red t-shirt.</p>",
      price: 19.99,
      amazonUrl: "https://amazon.com/dp/B00000RED",
      mainImage: "https://placehold.co/600x600/red/white?text=Red+Shirt",
      images: JSON.stringify([
        "https://placehold.co/600x600/red/white?text=Red+Front",
        "https://placehold.co/600x600/red/white?text=Red+Back"
      ]),
      bulletPoints: JSON.stringify(["100% Cotton", "Bright Red Color"]),
      categoryId: parent.categoryId,
      active: true,
      // Link to parent
      parentId: parent.id,
      // Define attributes
      variantAttributes: { "Color": "Red", "Size": "L" }
    }
  })
  console.log(`Created Child 1 (Red): ${redShirt.slug}`)

  // 3. Create Child Variant 2 (Blue)
  const blueShirt = await prisma.product.create({
    data: {
      title: "Classic Cotton T-Shirt - Blue",
      slug: "classic-cotton-t-shirt-blue-" + Date.now(),
      description: "<p>A cool blue t-shirt.</p>",
      price: 21.99,
      amazonUrl: "https://amazon.com/dp/B00000BLUE",
      mainImage: "https://placehold.co/600x600/blue/white?text=Blue+Shirt",
      images: JSON.stringify([
        "https://placehold.co/600x600/blue/white?text=Blue+Front",
        "https://placehold.co/600x600/blue/white?text=Blue+Back"
      ]),
      bulletPoints: JSON.stringify(["100% Cotton", "Deep Blue Color"]),
      categoryId: parent.categoryId,
      active: true,
      // Link to parent
      parentId: parent.id,
      // Define attributes
      variantAttributes: { "Color": "Blue", "Size": "L" }
    }
  })
  console.log(`Created Child 2 (Blue): ${blueShirt.slug}`)

  console.log('\nDone!')
  console.log(`Visit: http://localhost:3000/products/${redShirt.slug}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
