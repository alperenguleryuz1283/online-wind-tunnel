"use strict";

const english = new URLSearchParams(location.search).get("lang") === "en";
const uiLocale = english ? "en-US" : "tr-TR";
const englishText = {
  "Aerodinamik Laboratuvarı": "Aerodynamics Laboratory",
  "Akış etkin": "Flow running",
  "Çevrimiçi Rüzgar Tüneli": "Online Wind Tunnel",
  "Üç boyutlu test düzeneği": "3D test rig",
  "↺ Sıfırla": "↺ Reset",
  "∠ Ölçüm katmanı": "∠ Measurement overlay",
  "◫ İki deneyi karşılaştır": "◫ Compare two experiments",
  "B’nin açı ve hızını A ile eşle": "Match B’s angle and speed to A",
  "Kaldırma grafiği ↓": "Lift chart ↓",
  "Kameralar birlikte hareket eder": "Cameras move together",
  "Tünel görünümü": "Tunnel view",
  Genel: "Overview",
  Yan: "Side",
  Üst: "Top",
  "3D sahne için tarayıcınızda WebGL ve grafik hızlandırmayı etkinleştirin.":
    "Enable WebGL and graphics acceleration in your browser to view the 3D scene.",
  "Akış yönü": "Flow direction",
  "Sürükle · döndür / Kaydır · yakınlaş": "Drag to rotate / Scroll to zoom",
  "Deney kontrolleri": "Experiment controls",
  "Kanat profili": "Airfoil",
  "Hücum açısı": "Angle of attack",
  "Hava hızı": "Airspeed",
  Görünürlük: "Visibility",
  "Akış çizgileri": "Streamlines",
  "Kanatta Cp renkleri": "Surface Cp colors",
  "Cam paneller": "Glass panels",
  "Basınç dağılımı": "Pressure distribution",
  "Kanatta Cp": "Surface Cp",
  "Renkler 2B kesit hesabını kanat açıklığı boyunca gösterir. Grafikte bir eğriye veya kanadın renkli yüzeyine tıklayarak ölçüm noktasını seç.":
    "Surface colors show the 2D section solution repeated across the span. Click a curve or the colored wing surface to select a probe location.",
  "Üst yüzey": "Upper surface",
  "Alt yüzey": "Lower surface",
  "İşaretli yüzey": "Selected surface",
  "Ölçüm konumu (x/c)": "Probe position (x/c)",
  "0,40": "0.40",
  "Hesap yöntemi ve birimler": "Method and units",
  "Hess–Smith yöntemi, iki boyutlu profil çevresindeki sıkıştırılamaz, viskozitesiz ve yüzeye bağlı akışı 160 panelle çözer. Cp = 1 − (Vₜ/V∞)². Parantezdeki değer serbest akıma göre basınç farkıdır (Δp = ½ρV∞²Cp, ρ = 1,225 kg/m³). Bu modelde sabit açıda hız değiştiğinde Cp aynı kalır. Akış ayrılması, stall ve tünel duvarlarının etkileri model kapsamı dışındadır.":
    "The Hess–Smith method uses 160 panels to solve for incompressible, inviscid, attached flow around a two-dimensional airfoil. Cp = 1 − (Vₜ/V∞)². Values in parentheses give the pressure difference relative to the freestream (Δp = ½ρV∞²Cp, ρ = 1.225 kg/m³). At a fixed angle of attack, changing airspeed leaves Cp unchanged. The model excludes flow separation, stall and tunnel-wall effects.",
  "Veter çizgisi": "Chord line",
  "Ortalama eğrilik çizgisi": "Mean camber line",
  "Hava yönü": "Freestream direction",
  "α · Hücum açısı": "α · Angle of attack",
  "Kanat kesiti": "Airfoil section",
  "Parça inceleme": "Inspect a part",
  Kanat: "Wing",
  "Hava girişi": "Inlet",
  "Test bölmesi": "Test section",
  Fan: "Fan",
  "Kaldırma katsayısı ve hücum açısı":
    "Section lift coefficient vs. angle of attack",
  "2B profil · 160 panel": "2D section · 160 panels",
  "Karşılaştırma açısı": "Comparison angle",
  "Eğriler, sıfırdan farklı hava hızında ve yüzeye bağlı akış için hesaplanmıştır. Yüksek açılarda akış ayrılması ve stall etkileri modelin kapsamı dışındadır.":
    "The curves assume nonzero airspeed and attached flow. At high angles of attack, the model does not capture separation or stall.",
  "Cp’den kaldırma nasıl bulunuyor?": "How is lift calculated from Cp?",
  "Her panelde basınç kuvveti yüzeye dik etkir. Hesap, panelin basınç katsayısını (Cp) veter uzunluğuna oranlanmış panel uzunluğuyla çarpar ve kuvvetleri yönleriyle toplar. Toplamın serbest akıma dik bileşeni kesit kaldırma katsayısını (cₗ) verir. Grafikte iki profil aynı açıda okunur.":
    "Pressure acts normal to each panel. The solver multiplies each panel’s Cp by its length divided by the chord and sums the inward force vectors. The component perpendicular to the freestream gives the section lift coefficient (cₗ). The chart compares both airfoils at the same angle.",
  "Akış çizgileri temsili eğitim animasyonudur.":
    "The streamlines are an illustrative animation.",
  "Deney araçları": "Experiment tools",
  "Deney A": "Experiment A",
  "Deney B": "Experiment B",
  "Etkileşimli üç boyutlu sahne": "Interactive 3D scene",
  "Kamera açısı": "Camera view",
  "Üst ve alt yüzey basınç katsayısı, veter boyunca; negatif Cp yukarıda":
    "Upper and lower surface pressure coefficients along the chord, with negative Cp at the top",
  "Hücum açısına göre dönen kanat kesiti":
    "Airfoil section rotated to the selected angle of attack",
  "NACA 0012 ve 2412 için hücum açısına göre kesit kaldırma katsayısı":
    "Section lift coefficient versus angle of attack for NACA 0012 and NACA 2412",
  "Ⅱ　Akışı duraklat": "Ⅱ　Pause flow",
  "▶　Akışı başlat": "▶　Start flow",
  Duraklatıldı: "Paused",
  "Hız sıfır": "Zero airspeed",
  "Hız sıfır olduğu için Cp tanımsız.": "Cp is undefined at zero airspeed.",
  "Kesit kaldırma katsayısı cₗ = ": "Section lift coefficient cₗ = ",
  "Kesit kaldırma katsayısı cₗ · Hız sıfırken tanımsız":
    "Section lift coefficient cₗ · Undefined at zero airspeed",
  "Hücum açısı α (°)": "Angle of attack α (°)",
  " kanat kesiti": " airfoil section",
  "NACA 0012 simetrik bir kanat profilidir. En büyük kalınlığı veter uzunluğunun %12’sidir. Hücum açısını değiştirerek profilin hava akımına göre yönünü inceleyin.":
    "NACA 0012 is a symmetric airfoil with a maximum thickness of 12% of the chord. Change the angle of attack to see how the section is oriented relative to the freestream.",
  "Girişteki petek, havanın yanal hareketini azaltmaya yardımcı olur. Daralan kanal, akışı test bölmesine yönlendirir.":
    "The inlet honeycomb helps reduce lateral air motion. The contraction guides the flow into the test section.",
  "Saydam test bölmesi kanadı farklı yönlerden izlemeyi sağlar. Cam panelleri gizleyerek profili ve çevresindeki akış çizgilerini yakından inceleyin.":
    "The transparent test section lets you inspect the wing from different angles. Hide the glass panels for a closer look at the airfoil and the streamlines.",
  "Çıkıştaki fan havayı girişten test bölmesine doğru çeker. Hava hızı ayarı, fanın ve akış işaretlerinin animasyon hızını birlikte değiştirir.":
    "The outlet fan draws air through the inlet and test section. The airspeed control adjusts both the fan animation and the speed of the flow markers.",
  "NACA 2412 kamburlu bir profildir. Ortalama eğrilik çizgisi, hücum kenarından itibaren veterin %40’ında %2 yüksekliğe ulaşır. Profilin nominal kalınlığı veterin %12’sidir.":
    "NACA 2412 is a cambered airfoil. Its mean camber line reaches 2% of the chord at 40% chord from the leading edge. Its nominal thickness is 12% of the chord.",
};
function uiText(source) {
  return english ? (englishText[source] ?? source) : source;
}
document.documentElement.lang = english ? "en" : "tr";
if (english) {
  document.title = uiText(document.title);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const key = node.data.trim().replace(/\s+/gu, " ");
    if (Object.hasOwn(englishText, key))
      node.data = node.data.replace(/\S[\s\S]*\S|\S/u, () => englishText[key]);
  }
  document
    .querySelectorAll("[aria-label]")
    .forEach((el) =>
      el.setAttribute("aria-label", uiText(el.getAttribute("aria-label"))),
    );
}
document
  .querySelector(english ? "[hreflang=en]" : "[hreflang=tr]")
  .setAttribute("aria-current", "page");
