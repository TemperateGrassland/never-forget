# Never Forget readme

## Prisma

### Viewing Prisma tables in dev

`npx prisma studio`

### Prisma migrations

After making changes to the prisma schema, they can be applied into the local db with the following commands:

#### Running a schema migration: dev

`npx prisma migrate dev —name <meaningful-name>`

`npx prisma generate`

#### Running a schema migration: prod

Build commands are configured to run a new schema migration with each new build.
