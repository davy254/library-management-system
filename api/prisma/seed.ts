import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

const catalog = [
  {
    genre: 'Science Fiction',
    books: [
      { title: 'Dune', author: 'Frank Herbert', publishedYear: 1965 },
      { title: 'Neuromancer', author: 'William Gibson', publishedYear: 1984 },
      { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', publishedYear: 1969 },
      { title: 'Foundation', author: 'Isaac Asimov', publishedYear: 1951 },
    ],
  },
  {
    genre: 'Fantasy',
    books: [
      { title: 'The Hobbit', author: 'J.R.R. Tolkien', publishedYear: 1937 },
      { title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', publishedYear: 1968 },
      { title: 'The Name of the Wind', author: 'Patrick Rothfuss', publishedYear: 2007 },
      { title: 'Mistborn: The Final Empire', author: 'Brandon Sanderson', publishedYear: 2006 },
    ],
  },
  {
    genre: 'Mystery',
    books: [
      { title: 'And Then There Were None', author: 'Agatha Christie', publishedYear: 1939 },
      { title: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', publishedYear: 1902 },
      { title: 'Gone Girl', author: 'Gillian Flynn', publishedYear: 2012 },
      { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', publishedYear: 2005 },
    ],
  },
  {
    genre: 'African Literature',
    books: [
      { title: 'Things Fall Apart', author: 'Chinua Achebe', publishedYear: 1958 },
      { title: 'Weep Not, Child', author: 'Ngũgĩ wa Thiong’o', publishedYear: 1964 },
      { title: 'Half of a Yellow Sun', author: 'Chimamanda Ngozi Adichie', publishedYear: 2006 },
      { title: 'Petals of Blood', author: 'Ngũgĩ wa Thiong’o', publishedYear: 1977 },
    ],
  },
];

async function main() {
  // Clear old books so re-running the seed doesn't create duplicates
  await prisma.book.deleteMany();

  for (const { genre, books } of catalog) {
    // Create the genre if it doesn't exist yet, otherwise reuse it
    const savedGenre = await prisma.genre.upsert({
      where: { name: genre },
      update: {},
      create: { name: genre },
    });

    // Each book points to its genre through genreId
    for (const book of books) {
      await prisma.book.create({
        data: { ...book, genreId: savedGenre.id },
      });
    }
  }

  const genreCount = await prisma.genre.count();
  const bookCount = await prisma.book.count();
  console.log(`Seeded ${genreCount} genres and ${bookCount} books.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });