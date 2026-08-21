const fs = require('fs');
const path = require('path');
const { generateMeepleSvg } = require('./public/js/meepleAvatars');

const DB_FILE = path.join(__dirname, 'data_store.json');

const todayStr = new Date().toISOString().split('T')[0];

const initialData = {
  users: [
    {
      id: 'usr-1',
      username: 'wat',
      pin: '1234',
      name: 'พี่วัฒน์ (หัวหน้างาน)',
      role: 'manager',
      department: 'ผู้จัดการ/หัวหน้างาน',
      bu: 'all',
      avatar: generateMeepleSvg({ color: 'red', face: 'cool', accessory: 'crown' }),
      email: 'wat.mgr@tvmunk.com',
      joinedYear: 2025,
      joinedDate: '2025-01-01',
      leaveQuota: 9
    },
    {
      id: 'usr-2',
      username: 'milk',
      pin: '1234',
      name: 'พี่มิ้ว (หัวหน้างาน)',
      role: 'manager',
      department: 'ผู้จัดการ/หัวหน้างาน',
      bu: 'all',
      avatar: generateMeepleSvg({ color: 'pink', face: 'blush', accessory: 'crown' }),
      email: 'milk.mgr@tvmunk.com',
      joinedYear: 2025,
      joinedDate: '2025-01-01',
      leaveQuota: 9
    },
    {
      id: 'usr-arth',
      username: 'arth',
      pin: '1234',
      name: 'เซอร์อาร์ธ',
      role: 'member',
      department: 'วิดีโอ/ตัดต่อ',
      bu: 'bgn squad',
      avatar: generateMeepleSvg({ color: 'purple', face: 'sparkle', accessory: 'tie' }),
      email: 'arth@tvmunk.com',
      joinedYear: 2025,
      joinedDate: '2025-01-01',
      leaveQuota: 9
    },
    {
      id: 'usr-mook',
      username: 'mook',
      pin: '1234',
      name: 'มุก',
      role: 'member',
      department: 'การตลาด',
      bu: 'bgn square',
      avatar: generateMeepleSvg({ color: 'orange', face: 'wink', accessory: 'bowtie' }),
      email: 'mook@tvmunk.com',
      joinedYear: 2025,
      joinedDate: '2025-01-01',
      leaveQuota: 9
    },
    {
      id: 'usr-aon',
      username: 'aon',
      pin: '1234',
      name: 'อร',
      role: 'member',
      department: 'แอดมิน',
      bu: 'bgn squad',
      avatar: generateMeepleSvg({ color: 'blue', face: 'happy', accessory: 'flower' }),
      email: 'aon@tvmunk.com',
      joinedYear: 2025,
      joinedDate: '2025-01-01',
      leaveQuota: 9
    },
    {
      id: 'usr-pao',
      username: 'pao',
      pin: '1234',
      name: 'เปา',
      role: 'member',
      department: 'คอนเทนต์',
      bu: 'bgn squad',
      avatar: generateMeepleSvg({ color: 'green', face: 'glasses', accessory: 'star' }),
      email: 'pao@tvmunk.com',
      joinedYear: 2025,
      joinedDate: '2025-01-01',
      leaveQuota: 9
    }
  ],
  businessUnits: [
    { id: 'bgn square', name: 'bgn square', label: '🛍️ bgn square (ขายของ / E-Commerce)', color: '#8b5cf6', badgeBg: 'bg-purple-950/40 text-purple-300 border-purple-800/60' },
    { id: 'bgn squad', name: 'bgn squad', label: '🎬 bgn squad (สื่อ / มีเดีย)', color: '#ee2726', badgeBg: 'bg-[#ee2726]/15 text-[#ff6b6b] border-[#ee2726]/30 font-bold' }
  ],
  departments: [
    'คอนเทนต์',
    'กราฟิก',
    'วิดีโอ/ตัดต่อ',
    'การตลาด',
    'แอดมิน',
    'ผู้จัดการ/หัวหน้างาน'
  ],
  settings: {
    companyName: 'TVmunk - bgn',
    lineBotToken: '',
    lineTargetId: '',
    lineNotifyToken: '',
    lineWebhookUrl: '',
    enableLineNotify: false,
    theme: 'dark',
    workStartTime: '09:30', // Work start threshold
    workEndTime: '18:30'
  },
  attendances: [
    {
      id: 'att-1',
      userId: 'usr-1',
      userName: 'พี่วัฒน์ (หัวหน้างาน)',
      date: todayStr,
      clockIn: new Date(new Date().setHours(8, 55, 0, 0)).toISOString(),
      clockOut: null,
      workType: 'office',
      status: 'on_time',
      totalMinutes: 0,
      note: 'เข้าทำงานประจำออฟฟิศ bgn'
    }
  ],
  leaves: [
    {
      id: 'leave-1',
      userId: 'usr-1',
      userName: 'พี่วัฒน์ (หัวหน้างาน)',
      userRole: 'manager',
      department: 'ผู้จัดการ/หัวหน้างาน',
      bu: 'all',
      type: 'annual',
      startDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      period: 'full',
      daysCount: 1,
      reason: 'ลาพักผ่อนประจำปี',
      attachmentUrl: '',
      status: 'approved',
      approvedBy: 'usr-1',
      approvedByName: 'พี่วัฒน์ (หัวหน้างาน)',
      approvedAt: new Date().toISOString(),
      rejectionReason: '',
      createdAt: new Date().toISOString()
    }
  ],
  tasks: [
    {
      id: 'task-1',
      code: 'SQU-1001',
      title: 'เตรียมงานเปิดตัวแคมเปญ Flash Sale ประจำเดือน',
      bu: 'bgn square',
      departments: ['การตลาด', 'กราฟิก', 'แอดมิน'],
      department: 'การตลาด, กราฟิก, แอดมิน',
      priority: 'high',
      status: 'todo',
      assignedTo: 'usr-1',
      assignedBy: 'usr-1',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      deadline: new Date(Date.now() + 3600000 * 24).toISOString(),
      brief: 'วางแผนโปรโมชั่นสินค้า Flash Sale ประสานงานทีมกราฟิกและแอดมินพร้อมกัน',
      referenceUrl: 'https://drive.google.com',
      assetUrl: '',
      deliverableUrl: '',
      submitNote: '',
      submittedAt: null,
      completedAt: null,
      revisionCount: 0,
      revisions: [],
      activities: [
        {
          id: 'act-1',
          userId: 'usr-1',
          userName: 'พี่วัฒน์ (หัวหน้างาน)',
          action: 'created_task',
          details: 'สร้างใบงานตัวอย่างแรกในระบบ',
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
        }
      ]
    }
  ],
  notifications: [
    {
      id: 'notif-1',
      type: 'welcome',
      title: 'ยินดีต้อนรับสู่ TVmunk Task & HR Hub 🚀',
      message: 'ระบบพร้อมใช้งานสำหรับ bgn square และ bgn squad (รองรับบันทึกเวลาเข้า-ออก และระบบลางาน HR)',
      taskId: null,
      targetUserId: 'usr-1',
      targetRole: 'manager',
      isRead: false,
      createdAt: new Date().toISOString()
    }
  ],
  messages: [
    {
      id: 'msg-seed-1',
      channelId: 'general',
      senderId: 'usr-1',
      senderName: 'พี่วัฒน์ (หัวหน้างาน)',
      senderAvatar: generateMeepleSvg({ color: 'red', face: 'cool', accessory: 'tie' }),
      senderRole: 'manager',
      senderDept: 'ผู้จัดการ/หัวหน้างาน',
      senderBu: 'bgn squad',
      content: 'สวัสดีทีมงาน TVmunk - bgn ทุกคนครับ! 🚀 ระบบแชทแบบเรียลไทม์เปิดให้พูดคุย สั่งงาน และแชร์ไอเดียกันได้แล้วนะครับ',
      attachmentUrl: '',
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'msg-seed-2',
      channelId: 'general',
      senderId: 'usr-2',
      senderName: 'พี่มิ้ว (หัวหน้างาน)',
      senderAvatar: generateMeepleSvg({ color: 'pink', face: 'happy', accessory: 'flower' }),
      senderRole: 'manager',
      senderDept: 'ผู้จัดการ/หัวหน้างาน',
      senderBu: 'bgn square',
      content: 'ทุกคนสามารถเลือกคุยในห้องรวม ห้อง bgn square / squad หรือทักแชทส่วนตัว 1-on-1 หากันได้เลยนะคะ 😊',
      attachmentUrl: '',
      createdAt: new Date(Date.now() - 1800000).toISOString()
    }
  ]
};

class Database {
  constructor() {
    this.data = null;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        if (!this.data.attendances) this.data.attendances = initialData.attendances;
        if (!this.data.leaves) this.data.leaves = initialData.leaves;
        if (!this.data.messages) this.data.messages = initialData.messages;
        if (this.data.users) {
          this.data.users.forEach(u => {
            if (!u.pin) u.pin = '1234';
            if (!u.username) u.username = u.name.toLowerCase().replace(/[^a-z0-9]/g, '') || `user${u.id.replace('usr-', '')}`;
          });
        }
      } else {
        this.resetToConfiguredSeed();
      }
    } catch (err) {
      console.error('Error loading database, resetting:', err);
      this.resetToConfiguredSeed();
    }
  }

  resetToConfiguredSeed() {
    this.data = JSON.parse(JSON.stringify(initialData));
    this.save();
  }

  save() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  getTasks() { return this.data.tasks; }
  getTaskById(id) { return this.data.tasks.find(t => t.id === id); }
  getUsers() { return this.data.users; }
  getUserById(id) { return this.data.users.find(u => u.id === id); }
  getUserByUsernameOrEmail(identifier) {
    const idf = (identifier || '').toLowerCase().trim();
    return this.data.users.find(u => 
      (u.username && u.username.toLowerCase() === idf) || 
      (u.email && u.email.toLowerCase() === idf) ||
      (u.name && u.name.toLowerCase().includes(idf))
    );
  }
  getBusinessUnits() { return this.data.businessUnits; }
  getDepartments() { return this.data.departments; }
  getNotifications() { return this.data.notifications; }
  getSettings() { return this.data.settings; }
  getAttendances() { return this.data.attendances || []; }
  getLeaves() { return this.data.leaves || []; }

  normalizeDepartments(taskData) {
    let depts = [];
    if (Array.isArray(taskData.departments)) {
      depts = taskData.departments;
    } else if (Array.isArray(taskData.department)) {
      depts = taskData.department;
    } else if (typeof taskData.departments === 'string') {
      depts = taskData.departments.split(',').map(s => s.trim()).filter(Boolean);
    } else if (typeof taskData.department === 'string') {
      depts = taskData.department.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (depts.length === 0) depts = ['คอนเทนต์'];
    return depts;
  }

  createTask(taskData, creatorUser) {
    const buPrefix = taskData.bu === 'bgn square' ? 'SQU' : 'SQD';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const code = `${buPrefix}-${randomNum}`;
    const depts = this.normalizeDepartments(taskData);

    const newTask = {
      id: `task-${Date.now()}`,
      code: code,
      title: taskData.title.trim(),
      bu: taskData.bu,
      departments: depts,
      department: depts.join(', '),
      priority: taskData.priority || 'medium',
      status: 'todo',
      assignedTo: taskData.assignedTo,
      assignedBy: creatorUser.id,
      createdAt: new Date().toISOString(),
      deadline: taskData.deadline,
      brief: taskData.brief || '',
      referenceUrl: taskData.referenceUrl || '',
      assetUrl: taskData.assetUrl || '',
      deliverableUrl: '',
      submitNote: '',
      submittedAt: null,
      completedAt: null,
      revisionCount: 0,
      revisions: [],
      activities: [
        {
          id: `act-${Date.now()}`,
          userId: creatorUser.id,
          userName: creatorUser.name,
          action: 'created_task',
          details: `สร้างใบงานใหม่ [แผนก: ${depts.join(', ')}] และมอบหมายให้ ${this.getUserById(taskData.assignedTo)?.name || 'ผู้รับผิดชอบ'}`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    this.data.tasks.unshift(newTask);

    this.addNotification({
      type: 'new_task',
      title: '📥 มีการสั่งงานใหม่!',
      message: `${creatorUser.name} ได้สั่งงาน: "${newTask.title}" [${newTask.bu}] แผนก: ${depts.join(', ')}`,
      taskId: newTask.id,
      targetUserId: newTask.assignedTo,
      targetRole: 'member'
    });

    this.save();
    return newTask;
  }

  updateTaskStatus(taskId, newStatus, user, payload = {}) {
    const task = this.getTaskById(taskId);
    if (!task) return null;

    const oldStatus = task.status;
    task.status = newStatus;

    let activityDetail = `เปลี่ยนสถานะจาก [${oldStatus}] เป็น [${newStatus}]`;

    if (newStatus === 'in_progress') {
      if (user.role !== 'manager' || !task.assignedTo) {
        task.assignedTo = user.id;
      }
      activityDetail = `รับงานและเริ่มดำเนินการ (โดย ${user.name} - ${user.department})`;
      this.addNotification({
        type: 'status_change',
        title: '⏳ เริ่มดำเนินงานแล้ว',
        message: `${user.name} (${user.department}) ได้กดรับงาน "${task.title}" และเริ่มดำเนินงานแล้ว`,
        taskId: task.id,
        targetRole: 'manager'
      });
    } else if (newStatus === 'in_review') {
      task.deliverableUrl = payload.deliverableUrl || task.deliverableUrl;
      task.submitNote = payload.submitNote || task.submitNote;
      task.submittedAt = new Date().toISOString();
      activityDetail = `ส่งงานให้หัวหน้าตรวจ: ${payload.deliverableUrl ? 'แนบลิงก์ผลงานแล้ว' : ''} ${payload.submitNote ? `(Note: ${payload.submitNote})` : ''}`;

      this.addNotification({
        type: 'review_pending',
        title: '🔍 มีงานส่งตรวจใหม่!',
        message: `${user.name} ได้ส่งงาน "${task.title}" [${task.bu}] ให้ตรวจแล้ว`,
        taskId: task.id,
        targetRole: 'manager'
      });
    } else if (newStatus === 'revision') {
      task.revisionCount = (task.revisionCount || 0) + 1;
      const revisionItem = {
        id: `rev-${Date.now()}`,
        round: task.revisionCount,
        requestedBy: user.id,
        requestedByName: user.name,
        requestedAt: new Date().toISOString(),
        feedback: payload.feedback || 'มีจุดที่ต้องปรับปรุงแก้ไข',
        resolvedAt: null
      };
      task.revisions.push(revisionItem);
      activityDetail = `ส่งกลับแก้ไข (รอบที่ ${task.revisionCount}): "${revisionItem.feedback}"`;

      this.addNotification({
        type: 'revision_requested',
        title: '🔄 มีรายการสั่งแก้งาน (Revision)',
        message: `แจ้งแก้ไขงาน "${task.title}" (รอบที่ ${task.revisionCount}): ${revisionItem.feedback}`,
        taskId: task.id,
        targetUserId: task.assignedTo,
        targetRole: 'member'
      });
    } else if (newStatus === 'done') {
      task.completedAt = new Date().toISOString();
      activityDetail = `อนุมัติและปิดงานเสร็จสมบูรณ์ 🎉`;

      this.addNotification({
        type: 'task_approved',
        title: '✅ งานได้รับการอนุมัติแล้ว!',
        message: `งาน "${task.title}" ได้รับการอนุมัติเสร็จสมบูรณ์เรียบร้อยแล้ว`,
        taskId: task.id,
        targetUserId: task.assignedTo,
        targetRole: 'member'
      });
    }

    task.activities.push({
      id: `act-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      action: `status_to_${newStatus}`,
      details: activityDetail,
      timestamp: new Date().toISOString()
    });

    this.save();
    return task;
  }

  updateTask(taskId, updateData, user) {
    const task = this.getTaskById(taskId);
    if (!task) return null;

    if (updateData.title) task.title = updateData.title.trim();
    if (updateData.bu) task.bu = updateData.bu;
    if (updateData.departments || updateData.department) {
      const depts = this.normalizeDepartments(updateData);
      task.departments = depts;
      task.department = depts.join(', ');
    }
    if (updateData.priority) task.priority = updateData.priority;
    if (updateData.assignedTo) task.assignedTo = updateData.assignedTo;
    if (updateData.deadline) task.deadline = updateData.deadline;
    if (updateData.brief !== undefined) task.brief = updateData.brief;
    if (updateData.referenceUrl !== undefined) task.referenceUrl = updateData.referenceUrl;
    if (updateData.assetUrl !== undefined) task.assetUrl = updateData.assetUrl;

    task.activities.push({
      id: `act-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      action: 'updated_task',
      details: 'แก้ไขข้อมูลรายละเอียดของใบงาน',
      timestamp: new Date().toISOString()
    });

    this.save();
    return task;
  }

  deleteTask(taskId, user) {
    const index = this.data.tasks.findIndex(t => t.id === taskId);
    if (index === -1) return false;
    this.data.tasks.splice(index, 1);
    this.save();
    return true;
  }

  // -------------------------------------------------------------
  // HR & Attendance Module (ระบบบันทึกเวลา เข้า-ออก & ลางาน)
  // -------------------------------------------------------------
  getTodayAttendance(userId) {
    const today = new Date().toISOString().split('T')[0];
    return (this.data.attendances || []).find(a => a.userId === userId && a.date === today);
  }

  clockIn(user, workType = 'office', note = '') {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    let existing = this.getTodayAttendance(user.id);

    if (existing && existing.clockIn) {
      return { success: false, error: 'คุณได้ลงเวลาเข้างานของวันนี้ไปแล้ว' };
    }

    // Check if on time or late based on settings (default: 09:30)
    const thresholdTime = this.data.settings?.workStartTime || '09:30';
    const [tHour, tMin] = thresholdTime.split(':').map(Number);
    const thresholdDate = new Date();
    thresholdDate.setHours(tHour, tMin, 0, 0);

    const isLate = now > thresholdDate;
    const status = isLate ? 'late' : 'on_time';

    const record = {
      id: `att-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      department: user.department,
      bu: user.bu,
      date: today,
      clockIn: now.toISOString(),
      clockOut: null,
      workType: workType || 'office',
      status: status,
      totalMinutes: 0,
      note: note || ''
    };

    if (!this.data.attendances) this.data.attendances = [];
    this.data.attendances.unshift(record);

    this.addNotification({
      type: 'attendance_clockin',
      title: `${status === 'late' ? '🟡 ลงเวลาเข้างาน (สาย)' : '🟢 ลงเวลาเข้างานตรงเวลา'}`,
      message: `${user.name} ลงเวลาเข้างานแล้ว (${workType === 'wfh' ? 'Work From Home' : (workType === 'offsite' ? 'ออกกอง/นอกสถานที่' : 'ออฟฟิศ')}) เวลา ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`,
      targetRole: 'manager'
    });

    this.save();
    return { success: true, record };
  }

  clockOut(user, note = '') {
    const now = new Date();
    const existing = this.getTodayAttendance(user.id);

    if (!existing || !existing.clockIn) {
      return { success: false, error: 'ยังไม่ได้ลงเวลาเข้างานของวันนี้' };
    }

    if (existing.clockOut) {
      return { success: false, error: 'คุณได้ลงเวลาออกงานของวันนี้ไปแล้ว' };
    }

    existing.clockOut = now.toISOString();
    if (note) existing.note = (existing.note ? `${existing.note} | ` : '') + note;

    const diffMs = now - new Date(existing.clockIn);
    existing.totalMinutes = Math.max(0, Math.round(diffMs / (1000 * 60)));

    this.addNotification({
      type: 'attendance_clockout',
      title: '🚪 ลงเวลาออกงาน',
      message: `${user.name} ลงเวลาออกงานแล้ว (${Math.floor(existing.totalMinutes / 60)} ชม. ${existing.totalMinutes % 60} นาที)`,
      targetRole: 'manager'
    });

    this.save();
    return { success: true, record: existing };
  }

  requestLeave(leaveData, user) {
    const newLeave = {
      id: `leave-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      department: user.department,
      bu: user.bu,
      type: leaveData.type || 'sick', // 'sick', 'personal', 'annual', 'offsite'
      startDate: leaveData.startDate,
      endDate: leaveData.endDate || leaveData.startDate,
      period: leaveData.period || 'full', // 'full', 'morning', 'afternoon'
      daysCount: leaveData.daysCount || 1,
      reason: leaveData.reason || '',
      attachmentUrl: leaveData.attachmentUrl || '',
      status: user.role === 'manager' ? 'approved' : 'pending',
      approvedBy: user.role === 'manager' ? user.id : null,
      approvedByName: user.role === 'manager' ? user.name : null,
      approvedAt: user.role === 'manager' ? new Date().toISOString() : null,
      rejectionReason: '',
      createdAt: new Date().toISOString()
    };

    if (!this.data.leaves) this.data.leaves = [];
    this.data.leaves.unshift(newLeave);

    this.addNotification({
      type: 'leave_requested',
      title: '📋 มีคำขออนุมัติลางานใหม่',
      message: `${user.name} ขอ${this.getLeaveTypeLabel(newLeave.type)} วันที่ ${newLeave.startDate} ถึง ${newLeave.endDate} (${newLeave.reason})`,
      targetRole: 'manager'
    });

    this.save();
    return newLeave;
  }

  updateLeaveStatus(leaveId, status, approverUser, rejectionReason = '') {
    const leave = (this.data.leaves || []).find(l => l.id === leaveId);
    if (!leave) return null;

    leave.status = status;
    if (status === 'approved') {
      leave.approvedBy = approverUser.id;
      leave.approvedByName = approverUser.name;
      leave.approvedAt = new Date().toISOString();
      leave.rejectionReason = '';

      this.addNotification({
        type: 'leave_approved',
        title: '✅ คำขอลางานได้รับการอนุมัติแล้ว',
        message: `คำขอ${this.getLeaveTypeLabel(leave.type)} วันที่ ${leave.startDate} ได้รับการอนุมัติแล้ว`,
        targetUserId: leave.userId
      });
    } else if (status === 'rejected') {
      leave.approvedBy = approverUser.id;
      leave.approvedByName = approverUser.name;
      leave.approvedAt = new Date().toISOString();
      leave.rejectionReason = rejectionReason || 'ไม่อนุมัติ';

      this.addNotification({
        type: 'leave_rejected',
        title: '❌ คำขอลางานไม่ได้รับการอนุมัติ',
        message: `คำขอ${this.getLeaveTypeLabel(leave.type)} วันที่ ${leave.startDate} ไม่ได้รับการอนุมัติ: ${leave.rejectionReason}`,
        targetUserId: leave.userId
      });
    }

    this.save();
    return leave;
  }

  getLeaveTypeLabel(type) {
    const map = {
      sick: 'ลาป่วย (Sick Leave)',
      personal: 'ลากิจ (Personal Leave)',
      annual: 'ลาพักร้อน (Annual Leave)',
      offsite: 'ออกกอง/นอกสถานที่ (Offsite Work)'
    };
    return map[type] || type;
  }

  addNotification(notifData) {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: notifData.type || 'general',
      title: notifData.title,
      message: notifData.message,
      taskId: notifData.taskId || null,
      targetUserId: notifData.targetUserId || null,
      targetRole: notifData.targetRole || null,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(newNotif);
    if (this.data.notifications.length > 100) {
      this.data.notifications.pop();
    }
    this.save();
    return newNotif;
  }

  markNotificationAsRead(id) {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.save();
    }
    return notif;
  }

  markAllNotificationsAsRead(userId, userRole) {
    this.data.notifications.forEach(n => {
      if (!n.targetUserId || n.targetUserId === userId || (n.targetRole && n.targetRole === userRole)) {
        n.isRead = true;
      }
    });
    this.save();
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
    return this.data.settings;
  }

  addUser(userData) {
    const currentYear = new Date().getFullYear();
    const username = (userData.username || userData.name.toLowerCase().replace(/[^a-z0-9]/g, '') || `user${Date.now().toString().slice(-4)}`).toLowerCase();
    const newUser = {
      id: `usr-${Date.now()}`,
      username: username,
      pin: userData.pin || '1234',
      name: userData.name,
      role: userData.role || 'member',
      department: userData.department || 'คอนเทนต์',
      bu: userData.bu || 'bgn square',
      avatar: userData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userData.name)}&backgroundColor=ffd5dc`,
      email: userData.email || `${username}@tvmunk.com`,
      joinedDate: userData.joinedDate || todayStr,
      joinedYear: userData.joinedYear || currentYear,
      leaveQuota: userData.leaveQuota !== undefined ? parseFloat(userData.leaveQuota) : 0 // สมาชิกใหม่เริ่มต้นที่ 0 วัน
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUserPin(userId, newPin) {
    const user = this.getUserById(userId);
    if (!user) return false;
    user.pin = newPin;
    this.save();
    return true;
  }

  updateUserLeaveQuota(userId, newQuota) {
    const user = this.getUserById(userId);
    if (!user) return false;
    user.leaveQuota = parseFloat(newQuota) || 0;
    this.save();
    return true;
  }

  getUserLeaveStats(userId, year = new Date().getFullYear()) {
    const user = this.getUserById(userId);
    if (!user) return null;

    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    const userLeaves = (this.data.leaves || []).filter(l => 
      l.userId === userId && 
      l.status === 'approved' &&
      l.startDate >= startOfYear &&
      l.startDate <= endOfYear
    );

    const sickDays = userLeaves.filter(l => l.type === 'sick').reduce((s, l) => s + (parseFloat(l.daysCount) || 1), 0);
    const annualDays = userLeaves.filter(l => l.type === 'annual').reduce((s, l) => s + (parseFloat(l.daysCount) || 1), 0);
    const personalDays = userLeaves.filter(l => l.type === 'personal').reduce((s, l) => s + (parseFloat(l.daysCount) || 1), 0);
    const offsiteDays = userLeaves.filter(l => l.type === 'offsite').reduce((s, l) => s + (parseFloat(l.daysCount) || 1), 0);

    const joinedYear = user.joinedYear || (user.joinedDate ? new Date(user.joinedDate).getFullYear() : 2025);
    let quotaTotal = user.leaveQuota !== undefined ? user.leaveQuota : 0;
    
    // กติกา: สมาชิกใหม่ปีแรก 0 วัน, ปรับเป็น 9 วันให้อัตโนมัติเมื่อขึ้นปีใหม่ถัดไป (อายุงาน 1 ปีขึ้นไป)
    if (year > joinedYear) {
      quotaTotal = (user.leaveQuota !== undefined && user.leaveQuota > 0) ? user.leaveQuota : 9;
    }

    const quotaUsed = sickDays + annualDays; // ลาป่วย + ลาพักร้อน รวมกัน
    const quotaRemaining = Math.max(0, quotaTotal - quotaUsed);

    return {
      year,
      quotaTotal,
      quotaUsed,
      quotaRemaining,
      sickDays,
      annualDays,
      personalDays,
      offsiteDays,
      totalLeaveDays: sickDays + annualDays + personalDays + offsiteDays,
      isExceeded: quotaUsed > quotaTotal
    };
  }

  updateUserAvatar(userId, newAvatar) {
    const user = this.getUserById(userId);
    if (!user) return false;
    user.avatar = newAvatar;
    this.save();
    return true;
  }

  deleteUser(userId) {
    const idx = this.data.users.findIndex(u => u.id === userId);
    if (idx === -1) return false;
    const deleted = this.data.users.splice(idx, 1)[0];
    this.save();
    return deleted;
  }

  // -------------------------------------------------------------
  // Real-time Chat Module (ห้องแชททีม & แชทส่วนตัว)
  // -------------------------------------------------------------
  getDirectChannelId(userId1, userId2) {
    const sorted = [userId1, userId2].sort();
    return `dm_${sorted[0]}_${sorted[1]}`;
  }

  getChannels(currentUser) {
    const defaultChannels = [
      { id: 'general', name: '🏢 รวมทีม TVmunk - bgn', type: 'public', description: 'ห้องพูดคุยหลักของทุกคนในออฟฟิศ' },
      { id: 'square', name: '🛍️ bgn square', type: 'public', description: 'ห้องพูดคุยทีมขาย / E-Commerce' },
      { id: 'squad', name: '🎬 bgn squad', type: 'public', description: 'ห้องพูดคุยทีม Production / สื่อ' }
    ];

    const channelsWithMeta = defaultChannels.map(ch => {
      const msgs = (this.data.messages || []).filter(m => m.channelId === ch.id);
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
      return {
        ...ch,
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          senderName: lastMsg.senderName,
          createdAt: lastMsg.createdAt
        } : null,
        messageCount: msgs.length
      };
    });

    return channelsWithMeta;
  }

  getMessages(channelId, limit = 100) {
    if (!this.data.messages) this.data.messages = [];
    const filtered = this.data.messages.filter(m => m.channelId === channelId);
    return filtered.slice(-limit);
  }

  addChatMessage(senderUser, channelId, content, attachmentUrl = '') {
    if (!this.data.messages) this.data.messages = [];
    if (!content && !attachmentUrl) return null;

    const newMsg = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      channelId: channelId || 'general',
      senderId: senderUser.id,
      senderName: senderUser.name,
      senderAvatar: senderUser.avatar || '',
      senderRole: senderUser.role || 'member',
      senderDept: senderUser.department || '',
      senderBu: senderUser.bu || '',
      content: (content || '').trim(),
      attachmentUrl: (attachmentUrl || '').trim(),
      createdAt: new Date().toISOString()
    };

    this.data.messages.push(newMsg);

    if (this.data.messages.length > 3000) {
      this.data.messages = this.data.messages.slice(-3000);
    }

    this.save();
    return newMsg;
  }
}

module.exports = new Database();
