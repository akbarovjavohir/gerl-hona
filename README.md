# Grel Hona

Grel Hona - grill savdosi uchun yaratilgan boshqaruv tizimi. Loyiha web frontend, Node.js backend, SQLite baza va alohida Android ilovadan iborat. U ombor kirimi, savdo, nasiya, harajat va hisobotlarni bitta joyda yuritish uchun ishlatiladi.

## Asosiy imkoniyatlar

- Omborga kirim qilish va jami tannarxni kuzatish
- Savdo qilish va kunlik tushumni hisoblash
- Nasiya yozish va keyin uni savdoga o'tkazib yopish
- Qo'shimcha harajatlarni alohida saqlash
- Kunlik va umumiy moliyaviy hisobotlarni ko'rish
- Web va Android ilovalar orasida real vaqtga yaqin sinxronlash

## Texnologiyalar

- Frontend: React 19, Vite, React Router
- Backend: Node.js, Express
- Ma'lumotlar bazasi: SQLite
- Realtime: Server-Sent Events (SSE)
- Mobile: Android Studio loyihasi `android-app/`

## Loyiha tuzilmasi

```text
.
├── src/                # React frontend
│   ├── context/        # Global data boshqaruvi
│   ├── pages/          # Dashboard, Ombor, Savdo, Nasiya, Hisobot sahifalari
│   └── utils/          # Son va yordamchi funksiyalar
├── server/             # Express + SQLite backend
├── android-app/        # Android ilova
├── public/             # Statik fayllar
└── .env.example        # Frontend API sozlamasi
```

## O'rnatish

Loyiha ildizida frontend uchun dependency'larni o'rnating:

```bash
npm install
```

Backend dependency'lari alohida papkada bo'lsa, kerak bo'lsa quyidagini ham ishlating:

```bash
cd server
npm install
```

## Ishga tushirish

### 1. Frontend

```bash
npm run dev
```

### 2. Backend

```bash
npm run server
```

### 3. Frontend va backendni birga ishga tushirish

```bash
npm run start:all
```

### 4. Lokal tarmoq uchun ishga tushirish

Agar telefon yoki boshqa qurilmadan ulanish kerak bo'lsa:

```bash
npm run start:all:lan
```

Bu usulda backend `0.0.0.0` da ochiladi va frontend ham tarmoqdan ko'rinadi.

## Sozlash

Frontend API manzili `.env` orqali sozlanadi.

`.env` yaratish:

```bash
cp .env.example .env
```

Misol:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

Agar boshqa qurilmadan ulansangiz, `localhost` o'rniga server ishlayotgan kompyuter IP manzilini yozing:

```bash
VITE_API_BASE_URL=http://192.168.1.100:3000/api
```

## NPM buyruqlari

- `npm run dev` - frontend development server
- `npm run build` - production build
- `npm run preview` - build natijasini lokal preview qilish
- `npm run lint` - ESLint tekshiruvi
- `npm run server` - backendni lokal ishga tushirish
- `npm run server:lan` - backendni LAN uchun ochish
- `npm run start:all` - frontend va backendni birga ishga tushirish
- `npm run start:all:lan` - frontend va backendni LAN uchun birga ishga tushirish

## Ishlash mantiqi

### Ombor

Kirim qilingan mahsulotlar omborga qo'shiladi. Har bir yozuv uchun soni va umumiy summasi saqlanadi, tannarx esa avtomatik hisoblanadi.

### Savdo

Naqd savdo qilinganda mahsulot soni ombordan kamayadi va savdo jadvaliga yoziladi.

### Nasiya

Nasiya yozilganda mahsulot ombordan kamayadi, lekin u darhol naqd savdo sifatida hisoblanmaydi. `To'landi` tugmasi bosilganda nasiya savdoga o'tkaziladi va omborga qaytib qo'shilmaydi.

### Hisobot

Hisobot sahifasi naqd savdo, nasiya, chiqim va taxminiy foydani kunlik kesimda chiqaradi.

## Android ilova

`android-app/` ichida alohida Android Studio loyihasi bor. U shu backend API bilan ishlaydi va web ilova bilan bir xil ma'lumotlarni ko'radi.

Android ilovani ishga tushirish uchun:

1. `android-app/` ni Android Studio orqali oching
2. API manzili backend ishlayotgan qurilmaga qaraganini tekshiring
3. Emulator yoki telefon orqali ishga tushiring

## Sinxronlash

Loyiha polling emas, SSE orqali ishlaydi. Serverda ma'lumot o'zgarsa frontend va mobil ilova yangilanish signalini oladi.

## Eslatma

- SQLite baza lokal faylda saqlanadi
- Build qilingan yoki generatsiya qilingan fayllar repo'ga qo'shilmaydi
- `lint` ishlaganda ba'zi eski server fayllariga oid ESLint muammolari chiqishi mumkin

## Repo

GitHub:

```text
https://github.com/akbarovjavohir/gerl-hona
```
