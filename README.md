# Library Management System

A library book catalog built with NestJS, Prisma and PostgreSQL (hosted on Supabase). This stage covers the data layer: the schema, migrations and seed data.

## Setup

1. Install dependencies:
   ```bash
   cd api
   npm install
   ```
2. Copy `api/.env.example` to `api/.env` and put your own PostgreSQL connection string in `DATABASE_URL`. Never commit `.env`.
3. Generate the Prisma client and apply the migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```
4. Seed the database with 4 genres and 16 books:
   ```bash
   npx tsx prisma/seed.ts
   ```
5. Start the API:
   ```bash
   npm run start:dev
   ```

## Schema Decisions

### Book references Genre instead of embedding it

Each `Book` stores a `genreId` foreign key that points to a row in the `Genre` table, rather than carrying its own copy of the genre details. A genre is shared by many books, so it makes sense to store it once.

- **One source of truth.** Renaming a genre means updating a single row, not every book in that genre.
- **No inconsistent copies.** If genre names were typed into each book, the same genre could end up spelled several ways ("Sci-Fi", "Science Fiction", "scifi"). With a reference, every book points to the same row.
- **The database enforces valid data.** The foreign key stops a book from pointing to a genre that doesn't exist.
- **Genres are useful on their own.** Listing all genres or counting the books in each one is simple, without scanning every book.
- **The relationship fits the data.** One genre has many books and each book has one genre, which is a natural one-to-many relation.

The trade-off is that reading a book's genre needs a join. Prisma handles this with `include: { genre: true }`. Embedding would only be simpler if genre data were always read together with the book, never shared and rarely changed, and that isn't true here.

### Role is an enum

`User.role` uses a `Role` enum with two values, `PATRON` and `LIBRARIAN`. An enum limits the field to a fixed set of valid values, so typos like `"libarian"` can't be saved. New users default to `PATRON`, the lower-privilege role.

### Unique fields

- `User.email` is unique so two accounts can't share an email address.
- `Genre.name` is unique so the same genre can't be created twice.
- `Book.isbn` is unique so the same book can't be added twice.

### Optional fields

`Book.isbn` and `Book.publishedYear` are optional, because older or informal titles may not have an ISBN or a known publication year. Fields every book needs (`title`, `author`, `genreId`) are required.

### Seed data

The seed script inserts 4 genres (Science Fiction, Fantasy, Mystery, African Literature) and 4 books in each, 16 in total. It creates each genre first and then creates its books using that genre's `id`. It clears existing books before inserting, so running it again doesn't create duplicates.t


## Prisma vs. a Document Database

## Prisma vs. a Document Database

I haven't used a document database like MongoDB, but I have worked with JSON, which is
the format those databases store. With JSON, I would naturally write a book as one
object with the genre nested inside it, like `{ "title": "Dune", "genre": "Science
Fiction" }`. In Prisma that felt different: I had to define a separate `Genre` table
first, link each book to it with a `genreId`, and create genres before books in the
seed script. It was more work up front than nesting, but the database now rejects
a book whose `genreId` doesn't match a real genre, and a genre can be renamed in one
place instead of in every book.

### Review (stretch)

`Review` links a user to a book through two foreign keys (`bookId` and `userId`).
`@@unique([bookId, userId])` limits each user to one review per book, and
deleting a book or user also deletes their reviews. The 1 to 5 rating range is
not enforced by the schema, so it needs to be validated in the API.