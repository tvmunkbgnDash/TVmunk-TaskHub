# 🚀 TVmunk - bgn Task & Workflow Dashboard

ระบบบริหารจัดการงาน สั่งงาน รับงาน ส่งงาน และตรวจงานแบบครบวงจร ออกแบบมาเพื่อทีมงาน **TVmunk - bgn** โดยเฉพาะ รองรับ 3 Business Units หลัก ได้แก่:
1. 🛍️ **bgn square** (ขายของ / E-Commerce)
2. 🎬 **bgn squad** (สื่อ / มีเดีย / Production)
3. 🎮 **bgn smash** (ดิจิทัล / คอนเทนต์ / เทคโนโลยี)

---

## 🌟 ฟีเจอร์หลัก (Core Features)

- **Workflow 5 ขั้นตอน (5-Stage Lifecycle):**
  1. `📥 งานเข้าใหม่ / รอคิว (To Do)`
  2. `⏳ กำลังทำ (In Progress)`
  3. `🔍 ส่งตรวจ / รอตรวจสอบ (In Review)`
  4. `🔄 ส่งกลับแก้ไข (Revision Required)` - พร้อมบันทึกประวัติการสั่งแก้และจำนวนรอบ
  5. `✅ เสร็จสมบูรณ์ (Approved / Done)`
- **Kanban Board:** ลาก-วาง (Drag & Drop) งานระหว่างสถานะได้อย่างลื่นไหล
- **Multi-View:** สลับมุมมองระหว่าง **Kanban**, **ตารางงาน (List View)**, **ปฏิทินส่งงาน (Calendar View)** และ **หน้าสรุปสถิติ (Analytics)**
- **ฟอร์มสั่งงานมาตรฐาน (Smart Task Brief):** บังคับกรอกข้อมูลสำคัญ (ชื่องาน, BU, แผนก, ผู้รับผิดชอบ, กำหนดส่ง, ลิงก์ Ref, ลิงก์ Drive)
- **ระบบสิทธิ์และหน้าที่ (Roles & Permissions):**
  - 👑 **ผู้จัดการ / หัวหน้างาน:** สั่งงาน, ตรวจงาน, สั่งแก้งาน, อนุมัติงาน
  - 🧑‍💻 **ทีมงานทุกคน:** รับงาน, อัปเดตความคืบหน้า, ส่งมอบงาน
- **ระบบแจ้งเตือน Real-time & LINE Group Integration:**
  - แจ้งเตือนบนหน้าเว็บทันทีผ่าน Server-Sent Events (SSE)
  - เชื่อมต่อส่งแจ้งเตือนเข้า **LINE Group** ผ่าน LINE Notify / LINE Bot อัตโนมัติเวลามีงานใหม่ / ส่งงาน / สั่งแก้ / อนุมัติ
- **รองรับการใช้งานบนมือถือ (Mobile Responsive):** ตรวจงานและสั่งงานผ่านสมาร์ตโฟนได้อย่างสะดวก

---

## 💻 วิธีการเปิดใช้งานในออฟฟิศ (Local Office LAN)

1. ดับเบิลคลิกไฟล์ `start.bat` ในโฟลเดอร์โครงการ (หรือเปิด Terminal แล้วพิมพ์ `node server.js`)
2. เปิดเบราว์เซอร์ไปที่:
   - เครื่องเซิร์ฟเวอร์: `http://localhost:3000`
   - เครื่องอื่นๆ ในออฟฟิศ หรือมือถือที่ต่อ Wi-Fi เดียวกัน: `http://<IP-เครื่องเซิร์ฟเวอร์>:3000` (ระบบจะแสดง IP ให้ในหน้าตั้งค่า)

---

## ☁️ วิธีการติดตั้งขึ้น Cloud / VPS (Online Deployment)

ระบบถูกออกแบบให้เป็น Zero-Dependency Standalone Node.js App พร้อมฐานข้อมูล JSON Embedded จึงสามารถ Deploy ขึ้น Cloud ได้ทันที:

### 1. รันด้วย Docker (แนะนำ)
สร้างไฟล์ `Dockerfile` และรัน:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### 2. รันบน VPS (Ubuntu / Debian)
```bash
git clone <your-repo>
cd TVmunk-bgn-TaskHub
npm install
npm install -g pm2
pm2 start server.js --name "tvmunk-taskhub"
pm2 save
pm2 startup
```

---

## 🔔 การตั้งค่า LINE Notify / LINE Bot

1. เข้าไปที่ [notify-bot.line.me](https://notify-bot.line.me/) แล้วเข้าสู่ระบบด้วย LINE
2. กด **Generate Token** (ออก Access Token)
3. เลือกห้องแชท หรือ LINE Group ที่ต้องการให้บอทแจ้งเตือน
4. คัดลอก Token ที่ได้ มาใส่ในหน้า **ตั้งค่า (Settings)** ในระบบ TVmunk TaskHub แล้วกดบันทึก
5. ดึง LINE Notify Bot เข้ากลุ่ม LINE ของทีม เป็นอันเสร็จสิ้น
