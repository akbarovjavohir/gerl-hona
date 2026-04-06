# Grel Hona Android

Bu papka `grel hona` web/server loyihasiga ulangan alohida Android ilova uchun.

## Nima qiladi

- Android ilova `server/server.js` dagi API bilan ishlaydi.
- Desktop web va Android bir xil SQLite bazaga qaraydi.
- Lokal tarmoqda bir xil kompyuter serveriga ulanganda ma'lumotlar o'zgargan zahoti sinxron ko'rinadi.
- Desktop Electron ilova ishlayotgan bo'lsa ham telefon bilan sync bo'lishi uchun server endi LAN (`0.0.0.0:3000`) da ochiladi.

## Ishlatish

1. Kompyuterda backendni ishga tushiring:

```bash
cd server
HOST=0.0.0.0 npm start
```

Yoki loyiha ildizidan:

```bash
npm run start:all:lan
```

2. Telefon va kompyuter bir xil Wi-Fi tarmoqda bo'lsin.
3. Hozirgi buildda `API_BASE_URL` `http://192.168.0.128:3000/api/` qilib qo'yildi.
4. Agar keyin boshqa Wi-Fi yoki boshqa IP bo'lsa, `app/build.gradle.kts` ichidagi `API_BASE_URL` ni yangi kompyuter IP manziliga almashtiring.

Misol:

```kotlin
buildConfigField("String", "API_BASE_URL", "\"http://192.168.1.10:3000/api/\"")
```

5. Android Studio orqali `android-app` papkasini ochib APK yoki debug build qiling.

## Eslatma

- Hozirgi APK haqiqiy telefon uchun `192.168.0.128` IP bilan build qilingan.
- Emulator ishlatmoqchi bo'lsangiz `10.0.2.2` ga qaytarish kerak bo'ladi.
- Android ilova endi nasiya `quantity` ni ham hisobga oladi, shuning uchun ombor va hisobot web bilan bir xil ishlaydi.
