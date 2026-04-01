@echo off
echo Setting up TrustFlow Backend...
echo.

cd /d c:\files\Onedrive\Desktop\TRUSTFLOW\backend

echo Step 1: Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo Step 2: Starting Docker services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: docker-compose up failed
    pause
    exit /b 1
)

echo Waiting 30 seconds for services to initialize...
timeout /t 30 /nobreak > nul

echo.
echo Step 3: Generating Prisma client...
npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: prisma generate failed
    pause
    exit /b 1
)

echo.
echo Step 4: Setting up database schema...
npx prisma db push
if %errorlevel% neq 0 (
    echo ERROR: prisma db push failed
    pause
    exit /b 1
)

echo.
echo Step 5: Starting backend server...
echo Backend will start on http://localhost:3000
npm run start:dev

pause