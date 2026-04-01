@echo off
cd "c:\files\Onedrive\Desktop\TRUSTFLOW\backend"
docker exec trustflow-postgres psql -U postgres -d trustflow -c "CREATE EXTENSION IF NOT EXISTS vector;"
rmdir /s /q node_modules\.prisma
npx prisma generate
npx prisma db push
npm run start:dev