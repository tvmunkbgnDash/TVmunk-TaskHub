const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const os = require('os');
const db = require('./database');
const lineService = require('./lineService');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + Buffer.from(file.originalname, 'latin1').toString('utf8'));
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files and uploads
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// Server-Sent Events (SSE) for Real-time sync across devices
const sseClients = new Set();

function broadcastEvent(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(payload);
    } catch (err) {
      console.error('SSE send error, removing client:', err.message);
      sseClients.delete(client);
    }
  });
}

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const client = { id: Date.now(), res };
  sseClients.add(client);

  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to TVmunk Live Stream' })}\n\n`);

  req.on('close', () => {
    sseClients.delete(client);
  });
});

// Helper to get authenticated user from header
function getRequester(req) {
  const authHeader = req.headers['authorization'];
  let userId = req.headers['x-user-id'] || req.query.userId;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    // Token format is base64(userId:timestamp)
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const parts = decoded.split(':');
      if (parts[0]) userId = parts[0];
    } catch (e) {}
  }

  return db.getUserById(userId) || null;
}

// -------------------------------------------------------------
// Authentication Endpoints (ระบบ Login ส่วนตัว)
// -------------------------------------------------------------

app.post('/api/auth/login', (req, res) => {
  const { identifier, pin } = req.body;
  if (!identifier || !pin) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้ / อีเมล และรหัส PIN' });
  }

  const user = db.getUserByUsernameOrEmail(identifier) || db.getUserById(identifier);
  if (!user) {
    return res.status(401).json({ error: 'ไม่พบบัญชีผู้ใช้งานนี้ในระบบ' });
  }

  if (user.pin && user.pin !== pin.toString().trim()) {
    return res.status(401).json({ error: 'รหัส PIN ไม่ถูกต้อง' });
  }

  // Create lightweight session token
  const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
  
  // Exclude raw PIN from response
  const { pin: _, ...safeUser } = user;
  res.json({
    success: true,
    token,
    user: safeUser
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = getRequester(req);
  if (!user) {
    return res.status(401).json({ error: 'ไม่ได้เข้าสู่ระบบ' });
  }
  const { pin: _, ...safeUser } = user;
  res.json(safeUser);
});

app.post('/api/auth/change-pin', (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { oldPin, newPin } = req.body;
  if (!newPin || newPin.length < 4) {
    return res.status(400).json({ error: 'รหัส PIN ใหม่ต้องมีความยาวอย่างน้อย 4 หลัก' });
  }

  if (user.pin && user.pin !== oldPin) {
    return res.status(400).json({ error: 'รหัส PIN เดิมไม่ถูกต้อง' });
  }

  db.updateUserPin(user.id, newPin);
  res.json({ success: true, message: 'เปลี่ยนรหัส PIN เรียบร้อยแล้ว' });
});

// -------------------------------------------------------------
// System Bootstrap Data
// -------------------------------------------------------------
app.get('/api/bootstrap', (req, res) => {
  const currentUser = getRequester(req) || db.getUsers()[0];
  const isManager = currentUser && currentUser.role === 'manager';

  // Strict Privacy: Only managers see everyone's leaveQuota.
  // Regular members ONLY see their own leaveQuota; other users' leaveQuota is stripped.
  const safeUsers = db.getUsers().map(({ pin, ...u }) => {
    if (isManager || (currentUser && u.id === currentUser.id)) {
      return u;
    }
    const { leaveQuota: _, ...stripped } = u;
    return stripped;
  });

  const userAttendances = isManager ? db.getAttendances() : db.getAttendances().filter(a => a.userId === currentUser?.id);
  const userLeaves = isManager ? db.getLeaves() : db.getLeaves().filter(l => l.userId === currentUser?.id);

  res.json({
    currentUser: currentUser ? { ...currentUser, pin: undefined } : null,
    users: safeUsers,
    businessUnits: db.getBusinessUnits(),
    departments: db.getDepartments(),
    tasks: db.getTasks(),
    attendances: userAttendances,
    leaves: userLeaves,
    channels: db.getChannels(currentUser),
    notifications: db.getNotifications(),
    settings: db.getSettings(),
    serverInfo: {
      localIps: getLocalIpAddresses(),
      port: PORT,
      timestamp: new Date().toISOString()
    }
  });
});

// -------------------------------------------------------------
// Tasks CRUD with Privacy & Permission Controls
// -------------------------------------------------------------
app.get('/api/tasks', (req, res) => {
  res.json(db.getTasks());
});

app.get('/api/tasks/:id', (req, res) => {
  const task = db.getTaskById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.post('/api/tasks', async (req, res) => {
  const creator = getRequester(req);
  if (!creator) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนสั่งงาน' });
  }

  const { title, bu, department, departments, priority, assignedTo, deadline, brief, referenceUrl, assetUrl } = req.body;

  const validDept = departments || department;
  if (!title || !bu || !validDept || (Array.isArray(validDept) && validDept.length === 0) || !assignedTo || !deadline) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (Title, BU, แผนกที่รับผิดชอบ, ผู้รับผิดชอบ, กำหนดส่ง)' });
  }

  const newTask = db.createTask({
    title,
    bu,
    department,
    departments,
    priority: priority || 'medium',
    assignedTo,
    deadline,
    brief,
    referenceUrl,
    assetUrl
  }, creator);

  const assignee = db.getUserById(assignedTo);

  broadcastEvent('task_created', { task: newTask, creator, assignee });
  lineService.notifyNewTask(newTask, creator, assignee).catch(e => console.error(e));

  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const existing = db.getTaskById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  // Privacy Rule: Only Manager or the Creator/Assignee can update task brief
  if (user.role !== 'manager' && existing.assignedTo !== user.id && existing.assignedBy !== user.id) {
    return res.status(403).json({ error: '🔒 คุณไม่มีสิทธิ์แก้ไขรายละเอียดงานของสมาชิกท่านอื่น' });
  }

  const updatedTask = db.updateTask(req.params.id, req.body, user);
  broadcastEvent('task_updated', { task: updatedTask, user });
  res.json(updatedTask);
});

app.post('/api/tasks/:id/status', async (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { status, deliverableUrl, submitNote, feedback } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  const task = db.getTaskById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  // Privacy & Role Permission Rules:
  // 1. Approval (done) can ONLY be performed by Manager
  if (status === 'done' && user.role !== 'manager') {
    return res.status(403).json({ error: '🔒 เฉพาะหัวหน้างาน (พี่วัฒน์) เท่านั้นที่มีสิทธิ์อนุมัติปิดงานสมบูรณ์' });
  }

  // 2. Request Revision can ONLY be performed by Manager
  if (status === 'revision' && user.role !== 'manager') {
    return res.status(403).json({ error: '🔒 เฉพาะหัวหน้างานเท่านั้นที่มีสิทธิ์ส่งกลับแก้ไข' });
  }

  // 3. Department & Assignee Permission Check:
  // Members can accept/claim, start, or submit work if they are the direct assignee OR belong to the responsible department(s)
  if ((status === 'in_progress' || status === 'in_review' || status === 'todo') && user.role !== 'manager') {
    const taskDepts = Array.isArray(task.departments)
      ? task.departments
      : (task.department ? task.department.split(',').map(d => d.trim()) : []);

    const isDirectAssignee = task.assignedTo === user.id;
    const isDeptMember = user.department && taskDepts.some(d => 
      d.toLowerCase() === user.department.toLowerCase() ||
      user.department.toLowerCase().includes(d.toLowerCase()) ||
      d.toLowerCase().includes(user.department.toLowerCase())
    );

    if (!isDirectAssignee && !isDeptMember && task.assignedTo) {
      return res.status(403).json({ error: `🔒 แผนกของคุณ (${user.department}) ไม่ได้อยู่ในรายชื่อแผนกที่รับผิดชอบงานนี้ (${task.department})` });
    }
  }

  const updatedTask = db.updateTaskStatus(req.params.id, status, user, {
    deliverableUrl,
    submitNote,
    feedback
  });

  const assignee = db.getUserById(updatedTask.assignedTo);

  broadcastEvent('task_status_changed', { task: updatedTask, user, status });

  if (status === 'in_review') {
    lineService.notifyTaskSubmitted(updatedTask, user).catch(e => console.error(e));
  } else if (status === 'revision') {
    lineService.notifyTaskRevision(updatedTask, user, feedback, updatedTask.revisionCount).catch(e => console.error(e));
  } else if (status === 'done') {
    lineService.notifyTaskApproved(updatedTask, user, assignee).catch(e => console.error(e));
  }

  res.json(updatedTask);
});

app.delete('/api/tasks/:id', (req, res) => {
  const user = getRequester(req);
  if (!user || user.role !== 'manager') {
    return res.status(403).json({ error: '🔒 เฉพาะหัวหน้างานเท่านั้นที่มีสิทธิ์ลบใบงาน' });
  }

  const success = db.deleteTask(req.params.id, user);
  if (!success) return res.status(404).json({ error: 'Task not found' });

  broadcastEvent('task_deleted', { taskId: req.params.id, user });
  res.json({ success: true, message: 'Task deleted successfully' });
});

// -------------------------------------------------------------
// User Management
// -------------------------------------------------------------
app.get('/api/users', (req, res) => {
  const currentUser = getRequester(req);
  const isManager = currentUser && currentUser.role === 'manager';
  const safeUsers = db.getUsers().map(({ pin, ...u }) => {
    if (isManager || (currentUser && u.id === currentUser.id)) {
      return u;
    }
    const { leaveQuota: _, ...stripped } = u;
    return stripped;
  });
  res.json(safeUsers);
});

app.post('/api/users', (req, res) => {
  const user = getRequester(req);
  if (!user || user.role !== 'manager') {
    return res.status(403).json({ error: '🔒 เฉพาะหัวหน้างานเท่านั้นที่มีสิทธิ์เพิ่มสมาชิกใหม่' });
  }

  const { name, role, department, bu, email, pin, username, leaveQuota } = req.body;
  if (!name) return res.status(400).json({ error: 'ชื่อสมาชิกเป็นสิ่งจำเป็น' });

  const newUser = db.addUser({ name, role, department, bu, email, pin, username, leaveQuota: leaveQuota !== undefined ? parseFloat(leaveQuota) : 0 });
  const { pin: _, ...safeUser } = newUser;
  broadcastEvent('user_added', safeUser);
  res.status(201).json(safeUser);
});

app.post('/api/users/avatar', (req, res) => {
  const user = getRequester(req);
  if (!user) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนเปลี่ยนรูปโปรไฟล์' });
  }

  const { avatar } = req.body;
  if (!avatar) {
    return res.status(400).json({ error: 'ไม่พบข้อมูลรูปภาพหรืออวตาร' });
  }

  const success = db.updateUserAvatar(user.id, avatar);
  if (!success) {
    return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้งาน' });
  }

  const updatedUser = db.getUserById(user.id);
  const { pin: _, ...safeUser } = updatedUser;
  broadcastEvent('user_updated', safeUser);
  res.json({ success: true, user: safeUser });
});

app.post('/api/users/:id/quota', (req, res) => {
  const user = getRequester(req);
  if (!user || user.role !== 'manager') {
    return res.status(403).json({ error: '🔒 เฉพาะหัวหน้างานเท่านั้นที่มีสิทธิ์กำหนดโควตาวันลา' });
  }

  const { quota } = req.body;
  const numQuota = parseFloat(quota);
  if (isNaN(numQuota) || numQuota < 0) {
    return res.status(400).json({ error: 'โควตาวันลาต้องเป็นตัวเลขที่ถูกต้อง' });
  }

  const success = db.updateUserLeaveQuota(req.params.id, numQuota);
  if (!success) return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });

  const updatedUser = db.getUserById(req.params.id);
  const { pin: _, ...safeUser } = updatedUser;
  broadcastEvent('user_updated', safeUser);
  res.json({ success: true, user: safeUser });
});

app.delete('/api/users/:id', (req, res) => {
  const user = getRequester(req);
  if (!user || user.role !== 'manager') {
    return res.status(403).json({ error: '🔒 เฉพาะหัวหน้างาน (พี่วัฒน์ / พี่มิ้ว) เท่านั้นที่มีสิทธิ์ลบพนักงาน' });
  }

  const targetId = req.params.id;
  if (targetId === user.id) {
    return res.status(400).json({ error: 'ไม่สามารถลบบัญชีของตนเองที่กำลังเข้าสู่ระบบอยู่ได้' });
  }

  const deleted = db.deleteUser(targetId);
  if (!deleted) {
    return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้งานที่ต้องการลบ' });
  }

  const { pin: _, ...safeDeleted } = deleted;
  broadcastEvent('user_deleted', { userId: targetId, deletedUser: safeDeleted });
  res.json({ success: true, deletedUser: safeDeleted });
});

// -------------------------------------------------------------
// Notifications & Settings
// -------------------------------------------------------------
app.get('/api/notifications', (req, res) => {
  res.json(db.getNotifications());
});

app.post('/api/notifications/:id/read', (req, res) => {
  const notif = db.markNotificationAsRead(req.params.id);
  res.json(notif || { success: false });
});

app.post('/api/notifications/read-all', (req, res) => {
  const user = getRequester(req);
  if (user) {
    db.markAllNotificationsAsRead(user.id, user.role);
  }
  res.json({ success: true });
});

app.get('/api/settings', (req, res) => {
  res.json(db.getSettings());
});

app.post('/api/settings', (req, res) => {
  const user = getRequester(req);
  if (!user || user.role !== 'manager') {
    return res.status(403).json({ error: '🔒 เฉพาะหัวหน้างานเท่านั้นที่สามารถแก้ไขการตั้งค่าระบบได้' });
  }
  const updatedSettings = db.updateSettings(req.body);
  broadcastEvent('settings_updated', updatedSettings);
  res.json(updatedSettings);
});

app.post('/api/settings/test-line', async (req, res) => {
  const message = `\n🔔 [TVmunk - bgn] ทดสอบการเชื่อมต่อแจ้งเตือนสำเร็จ!\n` +
    `ระบบ Task & Workflow Dashboard พร้อมใช้งานแล้วครับ 🚀\n` +
    `เวลา: ${new Date().toLocaleString('th-TH')}`;
  
  const result = await lineService.sendNotification(message);
  res.json(result);
});

// -------------------------------------------------------------
// HR & Attendance Endpoints (บันทึกเวลา เข้า-ออก & ลางาน)
// -------------------------------------------------------------

app.get('/api/attendance', (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { date, userId, month } = req.query;
  let list = db.getAttendances();

  // Privacy rule: Members can ONLY view their own attendance logs
  if (user.role !== 'manager') {
    list = list.filter(a => a.userId === user.id);
  } else if (userId) {
    list = list.filter(a => a.userId === userId);
  }

  if (date) list = list.filter(a => a.date === date);
  if (month) list = list.filter(a => a.date && a.date.startsWith(month));

  res.json(list);
});

app.post('/api/attendance/clock-in', async (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนลงเวลา' });

  const { workType, note } = req.body;
  const result = db.clockIn(user, workType, note);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  broadcastEvent('attendance_clocked', { record: result.record, action: 'clock_in', user });
  lineService.notifyAttendanceClockIn(result.record).catch(e => console.error(e));

  res.status(201).json(result.record);
});

app.post('/api/attendance/clock-out', async (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนลงเวลา' });

  const { note } = req.body;
  const result = db.clockOut(user, note);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  broadcastEvent('attendance_clocked', { record: result.record, action: 'clock_out', user });
  res.json(result.record);
});

// Leave Endpoints with Privacy Controls
app.get('/api/leaves', (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { userId, status } = req.query;
  let list = db.getLeaves();

  // Privacy rule: Members can ONLY view their own leave requests
  if (user.role !== 'manager') {
    list = list.filter(l => l.userId === user.id);
  } else if (userId) {
    list = list.filter(l => l.userId === userId);
  }

  if (status) list = list.filter(l => l.status === status);

  res.json(list);
});

app.post('/api/leaves', async (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนยื่นใบลา' });

  const { type, startDate, endDate, period, daysCount, reason, attachmentUrl } = req.body;
  if (!type || !startDate || !reason) {
    return res.status(400).json({ error: 'กรุณากรอกประเภทการลา, วันที่ และเหตุผลให้ครบถ้วน' });
  }

  const newLeave = db.requestLeave({
    type,
    startDate,
    endDate,
    period,
    daysCount,
    reason,
    attachmentUrl
  }, user);

  broadcastEvent('leave_requested', { leave: newLeave, user });
  lineService.notifyLeaveRequest(newLeave).catch(e => console.error(e));

  res.status(201).json(newLeave);
});

app.post('/api/leaves/:id/status', async (req, res) => {
  const user = getRequester(req);
  if (!user || user.role !== 'manager') {
    return res.status(403).json({ error: '🔒 เฉพาะหัวหน้างาน (พี่วัฒน์ / HR) เท่านั้นที่มีสิทธิ์อนุมัติหรือปฏิเสธการลา' });
  }

  const { status, rejectionReason } = req.body;
  if (!status || (status !== 'approved' && status !== 'rejected')) {
    return res.status(400).json({ error: 'สถานะไม่ถูกต้อง (approved / rejected)' });
  }

  const updatedLeave = db.updateLeaveStatus(req.params.id, status, user, rejectionReason);
  if (!updatedLeave) return res.status(404).json({ error: 'ไม่พบข้อมูลใบลา' });

  broadcastEvent('leave_status_changed', { leave: updatedLeave, user, status });
  
  if (status === 'approved') {
    lineService.notifyLeaveApproved(updatedLeave, user).catch(e => console.error(e));
  }

  res.json(updatedLeave);
});

// -------------------------------------------------------------
// Real-time Chat Endpoints (ระบบแชททีม & แชทส่วนตัว)
// -------------------------------------------------------------

app.get('/api/chat/channels', (req, res) => {
  const user = getRequester(req);
  res.json(db.getChannels(user));
});

app.get('/api/chat/messages', (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { channelId, limit } = req.query;
  const targetChannel = channelId || 'general';

  // If DM channel, verify that requester is one of the participants or a manager
  if (targetChannel.startsWith('dm_')) {
    const parts = targetChannel.replace('dm_', '').split('_');
    if (!parts.includes(user.id) && user.role !== 'manager') {
      return res.status(403).json({ error: '🔒 คุณไม่มีสิทธิ์เข้าถึงห้องแชทส่วนตัวนี้' });
    }
  }

  const messages = db.getMessages(targetChannel, limit ? parseInt(limit) : 100);
  res.json(messages);
});

app.post('/api/chat/messages', (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนส่งข้อความ' });

  const { channelId, content, attachmentUrl } = req.body;
  if (!content && !attachmentUrl) {
    return res.status(400).json({ error: 'กรุณากรอกข้อความหรือแนบลิงก์' });
  }

  const targetChannel = channelId || 'general';

  if (targetChannel.startsWith('dm_')) {
    const parts = targetChannel.replace('dm_', '').split('_');
    if (!parts.includes(user.id) && user.role !== 'manager') {
      return res.status(403).json({ error: '🔒 คุณไม่มีสิทธิ์ส่งข้อความในห้องนี้' });
    }
  }

  const newMsg = db.addChatMessage(user, targetChannel, content, attachmentUrl);
  if (!newMsg) return res.status(400).json({ error: 'Failed to create message' });

  broadcastEvent('chat_message', newMsg);
  res.status(201).json(newMsg);
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    originalName: req.file.originalname,
    fileName: req.file.filename,
    size: req.file.size,
    url: fileUrl
  });
});

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const k in interfaces) {
    for (const k2 in interfaces[k]) {
      const address = interfaces[k][k2];
      if (address.family === 'IPv4' && !address.internal && !address.address.startsWith('169.254.')) {
        addresses.push(address.address);
      }
    }
  }
  return addresses.length ? addresses : ['127.0.0.1'];
}

app.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIpAddresses();
  console.log(`\n======================================================`);
  console.log(`🚀 TVmunk - bgn Task & Workflow Dashboard is running!`);
  console.log(`💻 Local:   http://localhost:${PORT}`);
  ips.forEach(ip => {
    console.log(`🌐 Office LAN: http://${ip}:${PORT}`);
  });
  console.log(`======================================================\n`);
});
