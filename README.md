# Grel Hona

Bu loyiha grill savdosi uchun web boshqaruv paneli, Node backend va SQLite bazadan iborat.

## Ishga tushirish

Frontend:

```bash
npm run dev
```

Backend:

```bash
cd server
npm start
```

Lokal tarmoq uchun backend:

```bash
npm run server:lan
```

Frontend va backendni LAN uchun birga ishga tushirish:

```bash
npm run start:all:lan
```

## API manzili

Frontend `VITE_API_BASE_URL` orqali sozlanadi.

```bash
cp .env.example .env
```

`.env` misol:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

Telefon yoki boshqa qurilmadan ulash uchun `localhost` o'rniga kompyuter IP manzilini yozing.

## Android ilova

`android-app/` ichida alohida Android Studio loyihasi yaratildi. U shu backend API bilan ishlaydi va desktop web bilan bir xil bazadagi ma'lumotlarni ko'radi.

## Sinxronlash

Sinxronlash interval polling emas. Server `SSE` event yuboradi va web ham, Android ham faqat ma'lumot o'zgarganda yangilanadi.
