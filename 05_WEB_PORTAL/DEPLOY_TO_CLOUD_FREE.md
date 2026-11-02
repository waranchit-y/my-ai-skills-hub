# ☁️ คู่มือนำ AI Skills Hub ขึ้นระบบออนไลน์ฟรี (GitHub Pages / Cloudflare)

หากคุณต้องการเปิดดูเว็บนี้และกดดาวน์โหลดไฟล์ `.zip` ได้โดยตรงจากคอมที่ทำงาน โดยไม่ต้องพก Flash Drive ทุกครั้ง สามารถนำเว็บนี้ขึ้น Cloud ฟรีได้ใน 3 นาที!

---

## 🚀 วิธีที่ 1: ใช้ GitHub Pages (แนะนำ ฟรี 100% ปลอดภัย)

### ขั้นตอน:
1. เปิดเว็บ [GitHub.com](https://github.com) แล้วกด **New repository**
   - ตั้งชื่อ เช่น `my-ai-skills-hub`
   - เลือกเป็น **Public** (เพื่อให้เปิดดูผ่าน GitHub Pages ฟรีได้) หรือ **Private** (ถ้ามี GitHub Pro)
   - กด **Create repository**

2. ก๊อปปี้ไฟล์ทั้งหมดในโฟลเดอร์ `05_WEB_PORTAL` ไปใส่ในโฟลเดอร์ Repository:
   - `index.html`
   - `agent_skills_bundle.zip`
   - ไฟล์ประกอบอื่นๆ

3. อัปโหลดขึ้น GitHub ผ่านหน้าเว็บ (Drag & Drop) หรือผ่าน Git Command:
   ```bash
   git init
   git add .
   git commit -m "Update AI Skills Hub"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/my-ai-skills-hub.git
   git push -u origin main
   ```

4. เปิดใช้งาน GitHub Pages:
   - ไปที่แท็บ **Settings** ของ Repository บน GitHub
   - เลือกเมนูด้านซ้าย **Pages**
   - ในส่วน **Branch** ให้เลือก `main` โฟลเดอร์ `/ (root)` แล้วกด **Save**
   - รอประมาณ 1-2 นาที คุณจะได้ URL เว็บส่วนตัว เช่น:
     `https://<YOUR_USERNAME>.github.io/my-ai-skills-hub/`

5. **ผลลัพธ์:** เมื่อคุณนั่งอยู่ที่คอมที่ทำงาน เพียงเปิด URL นี้ในเบราว์เซอร์:
   - ดูสกิลทั้งหมดได้ครบถ้วน
   - กดปุ่มสีเขียว **"โหลดคลังสกิล (.ZIP)"** เพื่อโหลดไปติดตั้งในคอมที่ทำงานได้ทันที!
   - กดเปิดแท็บ **"ชุดคำสั่งคอมที่ทำงาน"** แล้วกดก๊อปปี้พร็อมต์ไปใช้ได้ทันที

---

## ⚡ วิธีที่ 2: ใช้ Cloudflare Pages (ฟรี เร็วระดับโลก)
1. สมัคร/ล็อกอินที่ [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. ไปที่ **Workers & Pages ➔ Create application ➔ Pages**
3. เลือก **Upload assets**
4. ลากโฟลเดอร์ `05_WEB_PORTAL` วางลงในหน้าเว็บได้ทันทีโดยไม่ต้องใช้ Git!
5. Cloudflare จะสร้างลิงก์ HTTPS ให้อัตโนมัติ (เช่น `https://my-skills.pages.dev`) ใช้งานได้ทันที 100%!
