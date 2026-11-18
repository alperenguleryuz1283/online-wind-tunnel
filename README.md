# Çevrimiçi Rüzgar Tüneli

**Türkçe** · [English](README.en.md)

Çevrimiçi Rüzgar Tüneli, NACA 0012 ve NACA 2412 kanat profillerinin etrafındaki akışı ve basınç dağılımını incelemek için geliştirilmiş etkileşimli bir tarayıcı uygulamasıdır. Üst çubuktaki Türkçe ve English bağlantılarıyla arayüz dilini seçebilirsiniz.

## Çalıştırma

Dosyaları aynı klasöre çıkarıp `index.html` dosyasını WebGL destekli bir tarayıcıda açın. Three.js pakete dahildir. Uygulama çevrimdışı çalışır.

## İlk deney

1. **İki deneyi karşılaştır** seçeneğini açın. A için NACA 0012, B için NACA 2412 seçin.
2. A deneyinde hücum açısını 0°, hızı 20 m/s yapın. **B’nin açı ve hızını A ile eşle** düğmesine basın.
3. **Ölçüm katmanı** ile veter ve ortalama eğrilik çizgilerini karşılaştırın. Basınç grafiğindeki bir noktaya tıklayarak yerini kanat üzerinde görün.
4. **Kaldırma grafiği** üzerinden iki profilin aynı hücum açısındaki kesit kaldırma katsayılarını okuyun.

## Hesap modeli

Hess–Smith yöntemi, profil çevresindeki iki boyutlu potansiyel akışı 160 panelle çözer. Yüzey teğetsel hızı basınç katsayısını, panel basınçlarının integrali kesit kaldırma katsayısını verir. Renkler kesit çözümünü kanat açıklığı boyunca gösterir. Tüneldeki hareketli akış çizgileri temsili animasyondur. Model sıkıştırılamaz, viskozitesiz ve bağlı akış varsayar; stall, duvar ve sonlu kanat etkilerini kapsamaz.

## Depo düzeni

- [index.html](index.html) uygulamanın giriş sayfasıdır.
- [src/](src/) kanat geometrisini, panel çözücüsünü, 3B sahneyi ve grafik etkileşimlerini içerir. Hesaplama için başlangıç noktaları [airfoils.js](src/airfoils.js) ve [pressure.js](src/pressure.js) dosyalarıdır.
- Arayüz çevirileri [language.js](src/language.js) dosyasındadır.
- [assets/](assets/) arayüzün stil dosyasını içerir.
- [vendor/three/](vendor/three/) çevrimdışı kullanım için Three.js r159 ve kendi [MIT lisansını](vendor/three/LICENSE.txt) içerir.
- [tests/](tests/) hesaplama modelinin otomatik doğrulamalarını içerir.

## Testleri çalıştırma

Node.js 22 ile depo kökünde çalıştırın:

```sh
node --test tests/physics.test.cjs
```

Testler geometriyi, simetrik profilin basınç dağılımını, kaldırmanın işaretini ve panel sayısına duyarlılığı kontrol eder. Test için ek paket kurulumu gerekmez.

## GitHub Pages

`online-wind-tunnel` deposunun kök dizinine dosyaları yükledikten sonra **Settings → Pages → Deploy from a branch** seçin. Yayın kaynağı olarak dosyaların bulunduğu dalı ve **/(root)** dizinini seçin.
