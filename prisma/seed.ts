import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const products = [
  {
    name: 'Classic Tee',
    slug: 'classic-tee',
    description: 'Camiseta clássica, confortável e versátil.',
    price: '29.99',
    colors: ['Black', 'White'],
    images: ['https://placehold.co/600x400?text=classic-tee+1', 'https://placehold.co/600x400?text=classic-tee+2'],
    sizes: ['S', 'M', 'L'],
    stock: 120,
    active: true,
  },
  {
    name: 'Vintage Hoodie',
    slug: 'vintage-hoodie',
    description: 'Moletom estilo vintage com caimento oversized.',
    price: '59.90',
    colors: ['Gray', 'Navy'],
    images: ['https://placehold.co/600x400?text=vintage-hoodie+1'],
    sizes: ['M', 'L', 'XL'],
    stock: 60,
    active: true,
  },
  {
    name: 'Slim Jeans',
    slug: 'slim-jeans',
    description: 'Jeans slim fit, tecido stretch para maior conforto.',
    price: '79.50',
    colors: ['Blue'],
    images: ['https://placehold.co/600x400?text=slim-jeans+1'],
    sizes: ['30', '32', '34', '36'],
    stock: 40,
    active: true,
  },
  {
    name: 'Sport Shorts',
    slug: 'sport-shorts',
    description: 'Shorts esportivo, ideal para treinos.',
    price: '24.00',
    colors: ['Black', 'Green'],
    images: ['https://placehold.co/600x400?text=sport-shorts+1'],
    sizes: ['S', 'M', 'L'],
    stock: 200,
    active: true,
  },
  {
    name: 'Leather Belt',
    slug: 'leather-belt',
    description: 'Cinto de couro legítimo com fivela metálica.',
    price: '19.99',
    colors: ['Brown', 'Black'],
    images: ['https://placehold.co/600x400?text=leather-belt+1'],
    sizes: ['M', 'L'],
    stock: 80,
    active: true,
  },
  {
    name: 'Summer Dress',
    slug: 'summer-dress',
    description: 'Vestido leve para dias quentes.',
    price: '49.00',
    colors: ['Yellow', 'White'],
    images: ['https://placehold.co/600x400?text=summer-dress+1'],
    sizes: ['S', 'M', 'L'],
    stock: 30,
    active: true,
  },
  {
    name: 'Running Shoes',
    slug: 'running-shoes',
    description: 'Tênis de corrida com amortecimento avançado.',
    price: '119.99',
    colors: ['Black', 'Red'],
    images: ['https://placehold.co/600x400?text=running-shoes+1'],
    sizes: ['40', '41', '42', '43'],
    stock: 75,
    active: true,
  },
  {
    name: 'Beanie Cap',
    slug: 'beanie-cap',
    description: 'Gorro em malha, estilo urbano.',
    price: '12.50',
    colors: ['Black', 'Gray'],
    images: ['https://placehold.co/600x400?text=beanie-cap+1'],
    sizes: [],
    stock: 150,
    active: true,
  },
  {
    name: 'Canvas Backpack',
    slug: 'canvas-backpack',
    description: 'Mochila de lona com múltiplos compartimentos.',
    price: '69.00',
    colors: ['Olive', 'Black'],
    images: ['https://placehold.co/600x400?text=canvas-backpack+1'],
    sizes: [],
    stock: 45,
    active: true,
  },
  {
    name: 'Striped Socks',
    slug: 'striped-socks',
    description: 'Meias listradas em algodão macio.',
    price: '6.99',
    colors: ['White', 'Blue'],
    images: ['https://placehold.co/600x400?text=striped-socks+1'],
    sizes: ['One Size'],
    stock: 300,
    active: true,
  },
]

async function main() {
  try {
    const res = await prisma.product.createMany({ data: products, skipDuplicates: true })
    console.log(`✅ Seed finalizado: ${res.count} produtos inseridos (skipDuplicates: true)`)
  } catch (error) {
    console.error('❌ Erro no seed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
