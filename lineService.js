const axios = require('axios');
const db = require('./database');

class LineService {
  async sendNotification(message) {
    const settings = db.getSettings();
    if (!settings.enableLineNotify) {
      console.log('[LINE Notify] Feature is disabled in settings. Message skipped:', message);
      return { success: false, reason: 'disabled' };
    }

    // 1. If LINE Messaging API (LINE Official Account Bot) is configured
    if (settings.lineBotToken && settings.lineTargetId) {
      try {
        const response = await axios.post(
          'https://api.line.me/v2/bot/message/push',
          {
            to: settings.lineTargetId,
            messages: [{ type: 'text', text: message }]
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${settings.lineBotToken}`
            },
            timeout: 8000
          }
        );
        console.log('[LINE Messaging API] Sent successfully:', response.status);
        return { success: true, status: response.status, method: 'messaging_api' };
      } catch (err) {
        console.error('[LINE Messaging API] Error sending push message:', err.response?.data || err.message);
      }
    }

    // 2. If LINE Notify Token is provided
    if (settings.lineNotifyToken) {
      try {
        const response = await axios.post(
          'https://notify-api.line.me/api/notify',
          new URLSearchParams({ message }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Bearer ${settings.lineNotifyToken}`
            },
            timeout: 8000
          }
        );
        console.log('[LINE Notify] Sent successfully:', response.status);
        return { success: true, status: response.status, method: 'line_notify' };
      } catch (err) {
        console.error('[LINE Notify] Error sending notify:', err.response?.data || err.message);
      }
    }

    // 3. If Custom Webhook URL is provided (e.g. Make/Integromat/Zapier/Discord/Slack/LINE Bot Webhook)
    if (settings.lineWebhookUrl) {
      try {
        const response = await axios.post(
          settings.lineWebhookUrl,
          {
            text: message,
            message: message,
            timestamp: new Date().toISOString()
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 8000
          }
        );
        console.log('[LINE Webhook] Sent successfully:', response.status);
        return { success: true, status: response.status, method: 'webhook' };
      } catch (err) {
        console.error('[LINE Webhook] Error sending webhook:', err.response?.data || err.message);
      }
    }

    return { success: false, reason: 'No token or webhook configured' };
  }

  // Pre-formatted LINE notification templates for TVmunk - bgn
  async notifyNewTask(task, assigner, assignee) {
    const deadlineStr = new Date(task.deadline).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
    const priorityIcon = task.priority === 'urgent' ? '🔥 ด่วนที่สุด (Urgent)' : (task.priority === 'high' ? '⚡ ด่วนสูง' : '📌 ปกติ');
    
    const msg = `\n📢 [TVmunk - bgn] มีงานใหม่!\n` +
      `------------------------\n` +
      `🏷️ รหัสงาน: ${task.code}\n` +
      `💼 แบรนด์/BU: ${task.bu}\n` +
      `📌 หัวข้อ: ${task.title}\n` +
      `👥 แผนก: ${task.department}\n` +
      `🧑‍💻 ผู้รับผิดชอบ: ${assignee?.name || 'ทีมงาน'}\n` +
      `👑 ผู้สั่งงาน: ${assigner?.name || 'หัวหน้างาน'}\n` +
      `🚨 ความสำคัญ: ${priorityIcon}\n` +
      `⏰ กำหนดส่ง: ${deadlineStr}\n` +
      (task.referenceUrl ? `🔗 Ref: ${task.referenceUrl}\n` : '') +
      `------------------------\n` +
      `👉 เปิดดูงานในระบบ TVmunk TaskHub`;

    return this.sendNotification(msg);
  }

  async notifyTaskSubmitted(task, member) {
    const msg = `\n🔍 [TVmunk - bgn] มีงานส่งตรวจ!\n` +
      `------------------------\n` +
      `🏷️ รหัสงาน: ${task.code} (${task.bu})\n` +
      `📌 หัวข้อ: ${task.title}\n` +
      `🧑‍💻 ผู้ส่งงาน: ${member?.name || 'ทีมงาน'}\n` +
      `🔗 ลิงก์ผลงาน: ${task.deliverableUrl || '-'}\n` +
      (task.submitNote ? `💬 โน้ต: "${task.submitNote}"\n` : '') +
      `------------------------\n` +
      `👉 หัวหน้างานโปรดเข้าตรวจและอนุมัติในระบบ`;

    return this.sendNotification(msg);
  }

  async notifyTaskRevision(task, manager, feedback, round) {
    const msg = `\n🔄 [TVmunk - bgn] สั่งแก้งาน (รอบที่ ${round})\n` +
      `------------------------\n` +
      `🏷️ รหัสงาน: ${task.code} (${task.bu})\n` +
      `📌 หัวข้อ: ${task.title}\n` +
      `👑 หัวหน้างาน: ${manager?.name || 'ผู้จัดการ'}\n` +
      `📝 จุดที่ต้องแก้ไข:\n"${feedback}"\n` +
      `------------------------\n` +
      `👉 ผู้รับผิดชอบโปรดตรวจสอบและแก้ไขในระบบ`;

    return this.sendNotification(msg);
  }

  async notifyTaskApproved(task, manager, assignee) {
    const msg = `\n✅ [TVmunk - bgn] งานผ่านการอนุมัติแล้ว!\n` +
      `------------------------\n` +
      `🏷️ รหัสงาน: ${task.code} (${task.bu})\n` +
      `📌 หัวข้อ: ${task.title}\n` +
      `🧑‍💻 ผู้รับผิดชอบ: ${assignee?.name || 'ทีมงาน'}\n` +
      `👑 อนุมัติโดย: ${manager?.name || 'หัวหน้างาน'}\n` +
      `------------------------\n` +
      `🎉 ขอบคุณทีมงานทุกคนครับ!`;

    return this.sendNotification(msg);
  }

  async notifyAttendanceClockIn(record) {
    const timeStr = new Date(record.clockIn).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const statusText = record.status === 'late' ? '🟡 มาสาย' : '🟢 ตรงเวลา';
    const workTypeText = record.workType === 'wfh' ? '🏠 Work From Home' : (record.workType === 'offsite' ? '🎬 ออกกอง/นอกสถานที่' : '🏢 ออฟฟิศ');

    const msg = `\n⏰ [TVmunk - bgn] บันทึกเวลาเข้างาน\n` +
      `------------------------\n` +
      `👤 พนักงาน: ${record.userName}\n` +
      `👥 แผนก: ${record.department} (${record.bu})\n` +
      `🕒 เวลา: ${timeStr} น. [${statusText}]\n` +
      `📍 สถานที่: ${workTypeText}\n` +
      (record.note ? `💬 บันทึก: "${record.note}"\n` : '') +
      `------------------------`;

    return this.sendNotification(msg);
  }

  async notifyLeaveRequest(leave) {
    const periodText = leave.period === 'morning' ? 'ครึ่งวันเช้า' : (leave.period === 'afternoon' ? 'ครึ่งวันบ่าย' : 'เต็มวัน');
    const msg = `\n📋 [TVmunk - bgn] มีคำขอลางานใหม่\n` +
      `------------------------\n` +
      `👤 พนักงาน: ${leave.userName}\n` +
      `👥 แผนก: ${leave.department} (${leave.bu})\n` +
      `📌 ประเภทการลา: ${db.getLeaveTypeLabel(leave.type)}\n` +
      `📅 วันที่: ${leave.startDate} ถึง ${leave.endDate} (${periodText} - ${leave.daysCount} วัน)\n` +
      `📝 เหตุผล: "${leave.reason}"\n` +
      `------------------------\n` +
      `👉 หัวหน้างานโปรดเข้าพิจารณาอนุมัติในระบบ`;

    return this.sendNotification(msg);
  }

  async notifyLeaveApproved(leave, approver) {
    const msg = `\n✅ [TVmunk - bgn] แจ้งผลการอนุมัติวันลา\n` +
      `------------------------\n` +
      `👤 พนักงาน: ${leave.userName}\n` +
      `📌 ประเภทการลา: ${db.getLeaveTypeLabel(leave.type)}\n` +
      `📅 วันที่ลา: ${leave.startDate} ถึง ${leave.endDate}\n` +
      `👑 ผู้อนุมัติ: ${approver?.name || 'หัวหน้างาน'}\n` +
      `------------------------\n` +
      `บันทึกลงระบบ HR เรียบร้อยแล้ว`;

    return this.sendNotification(msg);
  }
}

module.exports = new LineService();
