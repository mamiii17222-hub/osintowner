# OSINT Stream - Hybrid Vercel Logger & Web Dashboard

Bu proje, Minecraft modundan gelen oyuncu mesajlarını ve `/home` koordinatlarını doğrudan Vercel üzerinde barındırılan bir API ve canlı Cyber Web Dashboard'a aktarır. İsteğe bağlı olarak gelen tüm verileri arka planda Discord Webhook'unuza da otomatik postalar.

## 🚀 Vercel'e Nasıl Dağıtılır (Deploy)?

### Yöntem 1: Vercel CLI İle (Hızlı)
1. Terminalde `vercel-logger` klasörüne girin:
   ```bash
   cd vercel-logger
   ```
2. Vercel komutunu çalıştırın:
   ```bash
   npx vercel
   ```
3. Vercel panelinden veya deploy esnasında şu Environment Variable'ları (Ortam Değişkenleri) ekleyin:
   - `DISCORD_WEBHOOK_URL`: (Discord webhook linkiniz)
   - `DASHBOARD_KEY`: `osint1337` (Paneli görüntülemek için kullanılacak şifre)

### Yöntem 2: GitHub Üzerinden
1. `vercel-logger` klasörünü bir GitHub deposuna yükleyin.
2. [vercel.com](https://vercel.com) adresine gidin -> **Add New Project** -> Depoyu seçin.
3. **Environment Variables** bölümüne `DISCORD_WEBHOOK_URL` ve `DASHBOARD_KEY` ekleyin.
4. **Deploy** butonuna tıklayın.

---

## 🔗 Mod Entegrasyonu
Vercel siteniz deploy edildikten sonra aldığınız adresi (`https://projeniz.vercel.app/api/log`) modun config dosyasına veya doğrudan koduna yerleştirin:

- Config Yolu: `.minecraft/config/swyzzy-quick-cmd.properties`
- Değer:
  ```properties
  webhook_url=https://projeniz.vercel.app/api/log
  ```
Mod, hem Discord formatındaki `{"content": "..."}` isteklerini hem de modern JSON formatını doğrudan bu endpoint'e iletecektir!
