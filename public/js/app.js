/**
 * TVmunk - bgn Task & HR Leave Hub
 * Trello-Inspired Project Management & Confidential HR Leave Engine
 * With Mini Calendar Date-Time Picker for Deadlines,
 * LINE Direct Share & Bot Integration Engine,
 * Individual Leave Quotas, Annual Reset (Jan 1),
 * and Cute Colorful Human-Faced Meeple Vector Avatars!
 */

class TaskHubApp {
  constructor() {
    this.currentUser = null;
    this.authToken = localStorage.getItem('tvmunk_auth_token') || null;
    this.users = [];
    this.businessUnits = [];
    this.departments = [];
    this.tasks = [];
    this.leaves = [];
    this.notifications = [];
    this.settings = {};
    this.serverInfo = {};
    
    this.activeView = 'kanban';
    this.filters = {
      bu: 'all',
      department: 'all',
      assignee: 'all',
      search: '',
      myTasksOnly: false
    };

    this.calendarDate = new Date();
    this.selectedTaskId = null;
    this.selectedLeaveId = null;
    this.tempSelectedAvatar = null;
    
    // Mini Calendar Picker State for Deadline
    this.pickerSelectedDate = new Date();
    this.pickerCurrentMonth = new Date();
    this.pickerSelectedTime = '18:00';

    // Real-time Chat Module State
    this.activeChatChannel = 'general';
    this.chatMessages = [];
    this.unreadChatCount = 0;
    this.chatSearchQuery = '';
    this.channels = [
      { id: 'general', name: '🏢 รวมทีม TVmunk - bgn', type: 'public', description: 'ห้องพูดคุยหลักของทุกคนในออฟฟิศ' },
      { id: 'square', name: '🛍️ bgn square', type: 'public', description: 'ห้องพูดคุยทีมขาย / E-Commerce' },
      { id: 'squad', name: '🎬 bgn squad', type: 'public', description: 'ห้องพูดคุยทีม Production / สื่อ' }
    ];

    this.sortables = [];
    this.charts = {};

    this.init();
  }

  safeIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  safeConfetti(opts) {
    if (typeof window.confetti === 'function') {
      window.confetti(opts);
    }
  }

  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    if (this.currentUser) {
      headers['x-user-id'] = this.currentUser.id;
    }
    return headers;
  }

  async init() {
    console.log('[TVmunk TaskHub] Initializing with Mini Calendar Picker, Leave Management & Cute Meeple Avatars...');
    await this.fetchBootstrapData();
    this.checkAuthSession();
    this.setupSSE();
    this.setupEventListeners();
    this.render();
    this.initSortable();
    this.safeIcons();
  }

  // 1. Fetch Bootstrap Data from Backend
  async fetchBootstrapData() {
    try {
      const res = await fetch(`/api/bootstrap`, {
        headers: this.getAuthHeaders()
      });
      const data = await res.json();
      
      this.users = data.users || [];
      this.businessUnits = data.businessUnits || [];
      this.departments = data.departments || [];
      this.tasks = data.tasks || [];
      this.leaves = data.leaves || [];
      this.notifications = data.notifications || [];
      this.channels = data.channels || this.channels;
      this.settings = data.settings || {};
      this.serverInfo = data.serverInfo || {};

      this.populateLoginUserPresets();
    } catch (err) {
      console.error('Error fetching bootstrap data:', err);
      this.showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลจากเซิร์ฟเวอร์', 'error');
    }
  }

  // 2. Authentication & Session Management
  checkAuthSession() {
    const savedUserJson = localStorage.getItem('tvmunk_current_user');
    const overlay = document.getElementById('login-overlay');

    if (this.authToken && savedUserJson) {
      try {
        this.currentUser = JSON.parse(savedUserJson);
        const matched = this.users.find(u => u.id === this.currentUser.id);
        if (matched) {
          this.currentUser = { ...matched, ...this.currentUser };
          if (overlay) overlay.classList.add('hidden');
          this.updateUserDisplay();
          this.populateSelectDropdowns();
          return;
        }
      } catch (e) {}
    }

    if (overlay) overlay.classList.remove('hidden');
  }

  populateLoginUserPresets() {
    const select = document.getElementById('login-user-select');
    if (!select) return;

    select.innerHTML = `
      <option value="">-- เลือกชื่อของคุณ หรือพิมพ์ชื่อผู้ใช้ --</option>
      ${this.users.map(u => `
        <option value="${u.username || u.id}">${u.name} (${u.role === 'manager' ? '👑 หัวหน้างาน' : u.department})</option>
      `).join('')}
    `;
  }

  handleSelectUserPreset(val) {
    const pinInput = document.getElementById('login-pin');
    if (pinInput) pinInput.focus();
  }

  async handleLogin(e) {
    e.preventDefault();
    const selectVal = document.getElementById('login-user-select').value;
    const pin = document.getElementById('login-pin').value.trim();

    if (!selectVal) {
      this.showToast('กรุณาเลือกบัญชีผู้ใช้งาน', 'error');
      return;
    }
    if (!pin) {
      this.showToast('กรุณาใส่รหัส PIN', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: selectVal, pin })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }

      this.authToken = data.token;
      this.currentUser = data.user;
      localStorage.setItem('tvmunk_auth_token', data.token);
      localStorage.setItem('tvmunk_current_user', JSON.stringify(data.user));

      const overlay = document.getElementById('login-overlay');
      if (overlay) overlay.classList.add('hidden');

      // Re-fetch bootstrap data with current user credentials
      await this.fetchBootstrapData();

      this.updateUserDisplay();
      this.populateSelectDropdowns();
      this.render();
      this.showToast(`ยินดีต้อนรับคุณ ${this.currentUser.name} 🚀`, 'success');
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
    }
  }

  handleLogout() {
    this.authToken = null;
    this.currentUser = null;
    localStorage.removeItem('tvmunk_auth_token');
    localStorage.removeItem('tvmunk_current_user');

    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.classList.remove('hidden');

    this.closeModal('user-menu');
    this.showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
  }

  openChangePinModal() {
    this.closeModal('user-menu');
    const form = document.getElementById('form-change-pin');
    if (form) form.reset();
    this.openModal('modal-change-pin');
  }

  async handleChangePin(e) {
    e.preventDefault();
    const oldPin = document.getElementById('old-pin').value.trim();
    const newPin = document.getElementById('new-pin').value.trim();

    try {
      const res = await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ oldPin, newPin })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถเปลี่ยน PIN ได้');

      this.closeModal('modal-change-pin');
      this.showToast('เปลี่ยนรหัส PIN ส่วนตัวสำเร็จแล้ว 🔑', 'success');
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
    }
  }

  // 3. Avatar Customization & Cute Meeple Picker
  openChangeAvatarModal() {
    if (!this.currentUser) {
      this.showToast('กรุณาเข้าสู่ระบบก่อนเปลี่ยนรูปโปรไฟล์', 'error');
      return;
    }

    this.closeModal('user-menu');
    this.tempSelectedAvatar = this.currentUser.avatar || '';

    const previewImg = document.getElementById('avatar-preview-img');
    const previewName = document.getElementById('avatar-preview-name');
    const previewStatus = document.getElementById('avatar-preview-status');

    if (previewImg) previewImg.src = this.tempSelectedAvatar;
    if (previewName) previewName.textContent = this.currentUser.name;
    if (previewStatus) previewStatus.textContent = 'รูปโปรไฟล์ปัจจุบันของคุณ';

    this.renderMeeplePresetsGrid();
    this.openModal('modal-change-avatar');
  }

  renderMeeplePresetsGrid() {
    const grid = document.getElementById('meeple-presets-grid');
    if (!grid || typeof MEEPLE_PRESETS === 'undefined') return;

    grid.innerHTML = MEEPLE_PRESETS.map(p => {
      const svgUri = generateMeepleSvg({ color: p.color, face: p.face, accessory: p.accessory });
      const isSelected = this.tempSelectedAvatar === svgUri;

      return `
        <div onclick="app.selectMeeplePreset('${p.id}')" id="meeple-preset-${p.id}" class="meeple-preset-card p-2 rounded-2xl bg-zinc-950 border ${isSelected ? 'border-[#ee2726] ring-2 ring-[#ee2726]/40' : 'border-zinc-800 hover:border-zinc-700'} cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5 group select-none">
          <img src="${svgUri}" alt="${p.name}" class="w-12 h-12 rounded-xl object-contain group-hover:scale-105 transition-transform">
          <span class="text-[10px] font-semibold text-zinc-300 group-hover:text-white truncate max-w-[80px] text-center">${p.name.split('(')[0]}</span>
        </div>
      `;
    }).join('');
  }

  selectMeeplePreset(presetId) {
    if (typeof MEEPLE_PRESETS === 'undefined') return;
    const preset = MEEPLE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const svgUri = generateMeepleSvg({ color: preset.color, face: preset.face, accessory: preset.accessory });
    this.tempSelectedAvatar = svgUri;

    const previewImg = document.getElementById('avatar-preview-img');
    const previewStatus = document.getElementById('avatar-preview-status');
    if (previewImg) previewImg.src = svgUri;
    if (previewStatus) previewStatus.textContent = `เลือก ${preset.name}`;

    document.querySelectorAll('.meeple-preset-card').forEach(el => {
      el.classList.remove('border-[#ee2726]', 'ring-2', 'ring-[#ee2726]/40');
      el.classList.add('border-zinc-800');
    });

    const targetEl = document.getElementById(`meeple-preset-${presetId}`);
    if (targetEl) {
      targetEl.classList.remove('border-zinc-800');
      targetEl.classList.add('border-[#ee2726]', 'ring-2', 'ring-[#ee2726]/40');
    }
  }

  handleCustomMeepleBuilderChange() {
    const color = document.getElementById('custom-meeple-color')?.value || 'red';
    const face = document.getElementById('custom-meeple-face')?.value || 'happy';
    const accessory = document.getElementById('custom-meeple-acc')?.value || 'none';

    const customSvgUri = generateMeepleSvg({ color, face, accessory });
    this.tempSelectedAvatar = customSvgUri;

    const previewImg = document.getElementById('avatar-preview-img');
    const previewStatus = document.getElementById('avatar-preview-status');
    if (previewImg) previewImg.src = customSvgUri;
    if (previewStatus) previewStatus.textContent = `อวตาร Meeple สไตล์คุณ (${color} / ${face})`;

    document.querySelectorAll('.meeple-preset-card').forEach(el => {
      el.classList.remove('border-[#ee2726]', 'ring-2', 'ring-[#ee2726]/40');
      el.classList.add('border-zinc-800');
    });
  }

  handleUploadAvatarFile(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.showToast('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (JPEG/PNG)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize & square-crop on client canvas for fast performance
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

        this.tempSelectedAvatar = dataUrl;

        const previewImg = document.getElementById('avatar-preview-img');
        const previewStatus = document.getElementById('avatar-preview-status');
        if (previewImg) previewImg.src = dataUrl;
        if (previewStatus) previewStatus.textContent = `📁 รูปภาพจากไฟล์: ${file.name}`;

        document.querySelectorAll('.meeple-preset-card').forEach(el => {
          el.classList.remove('border-[#ee2726]', 'ring-2', 'ring-[#ee2726]/40');
          el.classList.add('border-zinc-800');
        });

        this.showToast('โหลดรูปภาพตัวอย่างเรียบร้อยแล้ว อย่าลืมกดบันทึก', 'info');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async handleSaveAvatar() {
    if (!this.tempSelectedAvatar) {
      this.showToast('กรุณาเลือกรูปโปรไฟล์หรืออัปโหลดไฟล์', 'error');
      return;
    }

    try {
      const res = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ avatar: this.tempSelectedAvatar })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถบันทึกรูปโปรไฟล์ได้');

      this.currentUser = { ...this.currentUser, avatar: this.tempSelectedAvatar };
      localStorage.setItem('tvmunk_current_user', JSON.stringify(this.currentUser));

      const uIdx = this.users.findIndex(u => u.id === this.currentUser.id);
      if (uIdx !== -1) this.users[uIdx].avatar = this.tempSelectedAvatar;

      this.updateUserDisplay();
      this.render();
      this.closeModal('modal-change-avatar');
      this.showToast('เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว 🎨✨', 'success');
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
    }
  }

  // 4. Real-time Server-Sent Events (SSE)
  setupSSE() {
    try {
      const evtSource = new EventSource('/api/events');
      
      evtSource.addEventListener('connected', () => {
        console.log('⚡ Realtime stream connected to TVmunk server');
      });

      evtSource.addEventListener('task_created', (e) => {
        const payload = JSON.parse(e.data);
        this.tasks.unshift(payload.task);
        if (payload.task.assignedTo === this.currentUser?.id) {
          this.showToast(`📥 มีงานใหม่มอบหมายให้คุณ: ${payload.task.title}`, 'info');
        }
        this.render();
      });

      evtSource.addEventListener('task_status_changed', (e) => {
        const payload = JSON.parse(e.data);
        const idx = this.tasks.findIndex(t => t.id === payload.task.id);
        if (idx !== -1) this.tasks[idx] = payload.task;
        if (this.selectedTaskId === payload.task.id) this.renderTaskDetail(payload.task);
        this.render();
      });

      evtSource.addEventListener('task_updated', (e) => {
        const payload = JSON.parse(e.data);
        const idx = this.tasks.findIndex(t => t.id === payload.task.id);
        if (idx !== -1) this.tasks[idx] = payload.task;
        if (this.selectedTaskId === payload.task.id) this.renderTaskDetail(payload.task);
        this.render();
      });

      evtSource.addEventListener('task_deleted', (e) => {
        const payload = JSON.parse(e.data);
        this.tasks = this.tasks.filter(t => t.id !== payload.taskId);
        if (this.selectedTaskId === payload.taskId) this.closeModal('modal-task-detail');
        this.render();
      });

      evtSource.addEventListener('leave_requested', (e) => {
        const payload = JSON.parse(e.data);
        this.leaves.unshift(payload.leave);
        if (this.currentUser?.role === 'manager') {
          this.showToast(`📋 มีคำขอลางานใหม่จาก ${payload.leave.userName}`, 'info');
        }
        if (this.activeView === 'hr') this.renderHRView();
      });

      evtSource.addEventListener('leave_status_changed', (e) => {
        const payload = JSON.parse(e.data);
        const idx = this.leaves.findIndex(l => l.id === payload.leave.id);
        if (idx !== -1) this.leaves[idx] = payload.leave;
        if (payload.leave.userId === this.currentUser?.id) {
          this.showToast(`📋 คำขอลางานของคุณได้รับการ ${payload.status === 'approved' ? 'อนุมัติแล้ว ✅' : 'ปฏิเสธ ❌'}`, 'info');
        }
        if (this.activeView === 'hr') this.renderHRView();
      });

      evtSource.addEventListener('user_added', (e) => {
        const newUser = JSON.parse(e.data);
        this.users.push(newUser);
        this.populateSelectDropdowns();
        this.populateLoginUserPresets();
        this.renderTeamMembersList();
      });

      evtSource.addEventListener('user_updated', (e) => {
        const updatedUser = JSON.parse(e.data);
        const idx = this.users.findIndex(u => u.id === updatedUser.id);
        if (idx !== -1) this.users[idx] = { ...this.users[idx], ...updatedUser };
        if (this.currentUser && this.currentUser.id === updatedUser.id) {
          this.currentUser = { ...this.currentUser, ...updatedUser };
          this.updateUserDisplay();
        }
        this.render();
        if (this.activeView === 'hr') this.renderHRView();
      });

      evtSource.addEventListener('user_deleted', (e) => {
        const payload = JSON.parse(e.data);
        this.users = this.users.filter(u => u.id !== payload.userId);
        this.populateSelectDropdowns();
        this.populateLoginUserPresets();
        this.renderTeamMembersList();
        this.render();
      });

      evtSource.addEventListener('settings_updated', (e) => {
        this.settings = JSON.parse(e.data);
      });

      evtSource.addEventListener('chat_message', (e) => {
        const msg = JSON.parse(e.data);
        if (this.activeChatChannel === msg.channelId && this.activeView === 'chat') {
          this.chatMessages.push(msg);
          this.appendChatMessageHTML(msg);
          this.scrollChatToBottom();
        } else {
          this.unreadChatCount++;
          this.updateChatUnreadBadges();
          if (msg.senderId !== this.currentUser?.id) {
            this.showToast(`💬 ข้อความใหม่จาก ${msg.senderName}: "${(msg.content || 'ไฟล์แนบ').slice(0, 30)}"`, 'info');
          }
        }
      });
    } catch (e) {
      console.warn('SSE warning:', e);
    }
  }

  // 5. User Profile & Dropdowns
  updateUserDisplay() {
    if (!this.currentUser) return;
    const avatarEl = document.getElementById('current-user-avatar');
    const menuAvatarEl = document.getElementById('menu-user-avatar');
    const nameEl = document.getElementById('current-user-name');
    const roleEl = document.getElementById('current-user-role');
    const menuNameEl = document.getElementById('menu-user-fullname');
    const menuDeptEl = document.getElementById('menu-user-dept');
    const managerTeamSection = document.getElementById('manager-team-menu-section');

    if (avatarEl) avatarEl.src = this.currentUser.avatar;
    if (menuAvatarEl) menuAvatarEl.src = this.currentUser.avatar;
    if (nameEl) nameEl.textContent = this.currentUser.name;
    if (roleEl) {
      roleEl.textContent = this.currentUser.role === 'manager' ? '👑 หัวหน้างาน' : `🧑‍💻 ${this.currentUser.department}`;
    }
    if (menuNameEl) menuNameEl.textContent = this.currentUser.name;
    if (menuDeptEl) menuDeptEl.textContent = `${this.currentUser.department} • ${this.currentUser.bu}`;

    const chatMyAvatar = document.getElementById('chat-my-avatar');
    const chatMyName = document.getElementById('chat-my-name');
    if (chatMyAvatar) chatMyAvatar.src = this.currentUser.avatar;
    if (chatMyName) chatMyName.textContent = this.currentUser.name;

    if (managerTeamSection) {
      if (this.currentUser.role === 'manager') {
        managerTeamSection.classList.remove('hidden');
      } else {
        managerTeamSection.classList.add('hidden');
      }
    }

    this.renderNotificationBadge();
  }

  populateSelectDropdowns() {
    const assigneeSelect = document.getElementById('task-assignee');
    const filterAssignee = document.getElementById('filter-assignee');
    const hrFilterEmployee = document.getElementById('hr-filter-employee');

    if (assigneeSelect) {
      assigneeSelect.innerHTML = this.users.map(u => `
        <option value="${u.id}" ${this.currentUser && this.currentUser.id === u.id ? 'selected' : ''}>
          ${u.name} (${u.department}) - ${u.bu}
        </option>
      `).join('');
    }

    if (filterAssignee) {
      filterAssignee.innerHTML = `
        <option value="all">ทุกคนในทีม</option>
        <option value="me">🎯 งานของฉัน (${this.currentUser?.name || ''})</option>
        ${this.users.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
      `;
    }

    if (hrFilterEmployee) {
      hrFilterEmployee.innerHTML = `
        <option value="all">พนักงานทุกคน (All Employees)</option>
        ${this.users.map(u => `<option value="${u.id}">${u.name} (${u.department})</option>`).join('')}
      `;
    }
  }

  // 6. Team Management & Delete Member (เฉพาะหัวหน้างาน: พี่วัฒน์ / พี่มิ้ว)
  openManageTeamModal() {
    this.closeModal('user-menu');
    this.renderTeamMembersList();
    this.openModal('modal-manage-team');
  }

  renderTeamMembersList() {
    const listEl = document.getElementById('team-members-manage-list');
    if (!listEl) return;

    if (this.users.length === 0) {
      listEl.innerHTML = `<p class="text-xs text-zinc-500 py-4 text-center">ไม่มีรายชื่อพนักงาน</p>`;
      return;
    }

    listEl.innerHTML = this.users.map(u => {
      const isSelf = this.currentUser && this.currentUser.id === u.id;
      const isManager = u.role === 'manager';
      const quota = u.leaveQuota !== undefined ? u.leaveQuota : 9;

      return `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all gap-3">
          <div class="flex items-center space-x-3">
            <img src="${u.avatar}" class="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 object-cover">
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-bold text-xs text-zinc-100">${u.name}</span>
                ${isManager ? `<span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">👑 หัวหน้างาน</span>` : `<span class="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 font-medium">พนักงาน</span>`}
              </div>
              <p class="text-[11px] text-zinc-400 mt-0.5">${u.department} • สังกัด: ${u.bu}</p>
            </div>
          </div>

          <div class="flex items-center space-x-2 self-end sm:self-center">
            <!-- Quota Setting Form -->
            <div class="flex items-center space-x-1.5 bg-zinc-900 px-2.5 py-1 rounded-xl border border-zinc-800 text-xs">
              <span class="text-[11px] text-zinc-400">โควตา:</span>
              <input type="number" id="quota-input-${u.id}" value="${quota}" min="0" max="60" class="w-12 bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-white text-center font-bold">
              <span class="text-[10px] text-zinc-500">วัน/ปี</span>
              <button onclick="app.handleUpdateUserQuota('${u.id}')" title="บันทึกโควตา" class="p-1 rounded bg-zinc-800 hover:bg-[#ee2726] text-zinc-300 hover:text-white transition-colors">
                <i data-lucide="check" class="w-3 h-3"></i>
              </button>
            </div>

            ${isSelf ? `
              <span class="text-[10px] text-zinc-500 px-2.5 py-1 bg-zinc-900 rounded-xl border border-zinc-800">ฉัน</span>
            ` : `
              <button onclick="app.handleDeleteUser('${u.id}', '${u.name}')" title="ลบพนักงานออกจากระบบ" class="px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-semibold flex items-center space-x-1 transition-all active:scale-95">
                <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-400"></i>
                <span>ลบ</span>
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');

    this.safeIcons();
  }

  async handleUpdateUserQuota(userId) {
    const input = document.getElementById(`quota-input-${userId}`);
    if (!input) return;
    const newQuota = parseFloat(input.value);

    try {
      const res = await fetch(`/api/users/${userId}/quota`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ quota: newQuota })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถแก้ไขโควตาได้');

      const u = this.users.find(x => x.id === userId);
      if (u) u.leaveQuota = newQuota;

      this.showToast(`บันทึกโควตาวันลาใหม่ (${newQuota} วัน/ปี) สำเร็จ ✅`, 'success');
      this.renderHRView();
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
    }
  }

  async handleDeleteUser(userId, userName) {
    if (!confirm(`⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบ "${userName}" ออกจากระบบทีม TVmunk - bgn?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถลบพนักงานได้');

      this.users = this.users.filter(u => u.id !== userId);
      this.populateSelectDropdowns();
      this.populateLoginUserPresets();
      this.renderTeamMembersList();
      this.render();
      this.showToast(`ลบพนักงาน "${userName}" เรียบร้อยแล้ว`, 'info');
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
    }
  }

  // 7. Leave Calculation Helper (Jan 1st Annual Reset Engine & 1-Year Tenure Policy)
  calculateUserLeaveStats(userId, year = new Date().getFullYear()) {
    const user = this.users.find(u => u.id === userId) || (this.currentUser && this.currentUser.id === userId ? this.currentUser : null);
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    const userLeaves = (this.leaves || []).filter(l => 
      l.userId === userId && 
      l.status === 'approved' &&
      l.startDate >= startOfYear &&
      l.startDate <= endOfYear
    );

    const sickDays = userLeaves.filter(l => l.type === 'sick').reduce((s, l) => s + (parseFloat(l.daysCount) || 1), 0);
    const annualDays = userLeaves.filter(l => l.type === 'annual').reduce((s, l) => s + (parseFloat(l.daysCount) || 1), 0);
    const personalDays = userLeaves.filter(l => l.type === 'personal').reduce((s, l) => s + (parseFloat(l.daysCount) || 1), 0);
    const offsiteDays = userLeaves.filter(l => l.type === 'offsite').reduce((s, l) => s + (parseFloat(l.daysCount) || 1), 0);

    const joinedYear = user && (user.joinedYear || (user.joinedDate ? new Date(user.joinedDate).getFullYear() : 2025)) || 2025;
    let quotaTotal = user && user.leaveQuota !== undefined ? user.leaveQuota : 0;

    // กติกา: สมาชิกใหม่ปีแรกเริ่มต้นที่ 0 วัน, ปรับเป็น 9 วันให้อัตโนมัติเมื่อขึ้นปีใหม่ถัดไป (อายุงาน 1 ปีขึ้นไป)
    if (year > joinedYear) {
      quotaTotal = (user && user.leaveQuota !== undefined && user.leaveQuota > 0) ? user.leaveQuota : 9;
    }

    const quotaUsed = sickDays + annualDays; // Sick + Annual combined
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
      isExceeded: quotaUsed > quotaTotal,
      percentUsed: quotaTotal > 0 ? Math.min(100, Math.round((quotaUsed / quotaTotal) * 100)) : 0
    };
  }

  // 8. View Switching
  switchView(viewName) {
    this.activeView = viewName;
    
    // Toggle Desktop Tabs
    document.querySelectorAll('.view-tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeTab = document.getElementById(`tab-${viewName}`);
    if (activeTab) activeTab.classList.add('active');

    // Toggle Mobile Tabs
    ['kanban', 'list', 'chat', 'hr', 'analytics'].forEach(v => {
      const mobTab = document.getElementById(`mob-tab-${v}`);
      if (mobTab) {
        if (v === viewName) {
          mobTab.classList.remove('text-zinc-400');
          mobTab.classList.add('text-[#ee2726]');
        } else {
          mobTab.classList.remove('text-[#ee2726]');
          mobTab.classList.add('text-zinc-400');
        }
      }
    });

    // Floating chat button toggle
    const floatingBtn = document.getElementById('btn-floating-chat');
    if (floatingBtn) {
      if (viewName === 'chat') {
        floatingBtn.classList.add('hidden');
      } else {
        floatingBtn.classList.remove('hidden');
      }
    }

    // Sub header filter visibility (only for Kanban & List)
    const subFilter = document.getElementById('sub-header-filter');
    if (subFilter) {
      if (viewName === 'kanban' || viewName === 'list') {
        subFilter.classList.remove('hidden');
      } else {
        subFilter.classList.add('hidden');
      }
    }

    document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
    const targetPanel = document.getElementById(`view-${viewName}`);
    if (targetPanel) targetPanel.classList.remove('hidden');

    this.render();
    if (viewName === 'analytics') {
      this.renderAnalytics();
    } else if (viewName === 'hr') {
      this.renderHRView();
    } else if (viewName === 'chat') {
      this.unreadChatCount = 0;
      this.updateChatUnreadBadges();
      this.renderChatView();
    }
  }

  // 9. Quick Filters & Search
  toggleMyTasksQuickFilter() {
    this.filters.myTasksOnly = !this.filters.myTasksOnly;
    const btn = document.getElementById('btn-quick-my-tasks');
    if (btn) {
      if (this.filters.myTasksOnly) {
        btn.classList.add('bg-[#ee2726]/20', 'border-[#ee2726]', 'text-white');
        btn.classList.remove('bg-zinc-900', 'text-zinc-300');
      } else {
        btn.classList.remove('bg-[#ee2726]/20', 'border-[#ee2726]', 'text-white');
        btn.classList.add('bg-zinc-900', 'text-zinc-300');
      }
    }
    this.render();
  }

  setBuFilter(bu) {
    this.filters.bu = bu;
    document.querySelectorAll('.bu-filter-chip').forEach(c => c.classList.remove('active'));
    const btnId = bu === 'all' ? 'bu-btn-all' : (bu === 'bgn square' ? 'bu-btn-square' : 'bu-btn-squad');
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.add('active');
    this.render();
  }

  setDeptFilter(dept) {
    this.filters.department = dept;
    this.render();
  }

  setAssigneeFilter(val) {
    this.filters.assignee = val;
    this.render();
  }

  handleSearch(text) {
    this.filters.search = text.toLowerCase().trim();
    this.render();
  }

  getFilteredTasks() {
    return this.tasks.filter(t => {
      if (this.filters.myTasksOnly && this.currentUser) {
        if (t.assignedTo !== this.currentUser.id) return false;
      }
      if (this.filters.bu !== 'all' && t.bu !== this.filters.bu) return false;
      if (this.filters.department !== 'all') {
        const depts = Array.isArray(t.departments) ? t.departments : (t.department ? t.department.split(',').map(s => s.trim()) : []);
        if (!depts.includes(this.filters.department)) return false;
      }
      if (this.filters.assignee === 'me' && this.currentUser) {
        if (t.assignedTo !== this.currentUser.id) return false;
      } else if (this.filters.assignee !== 'all') {
        if (t.assignedTo !== this.filters.assignee) return false;
      }

      if (this.filters.search) {
        const query = this.filters.search;
        const assigneeName = this.users.find(u => u.id === t.assignedTo)?.name || '';
        const matchTitle = (t.title || '').toLowerCase().includes(query);
        const matchCode = (t.code || '').toLowerCase().includes(query);
        const matchBrief = (t.brief || '').toLowerCase().includes(query);
        const matchDept = (t.department || '').toLowerCase().includes(query);
        const matchAssignee = assigneeName.toLowerCase().includes(query);
        if (!matchTitle && !matchCode && !matchBrief && !matchAssignee && !matchDept) return false;
      }
      return true;
    });
  }

  // 10. Main Render Coordinator
  render() {
    const filtered = this.getFilteredTasks();
    if (this.activeView === 'kanban') {
      this.renderKanban(filtered);
    } else if (this.activeView === 'list') {
      this.renderList(filtered);
    } else if (this.activeView === 'calendar') {
      this.renderCalendar(filtered);
    } else if (this.activeView === 'analytics') {
      this.renderAnalytics();
    } else if (this.activeView === 'hr') {
      this.renderHRView();
    }
    this.safeIcons();
  }

  // 11. Kanban Board Renderer (Trello Fluid Cards)
  renderKanban(tasks) {
    const stages = ['todo', 'in_progress', 'in_review', 'revision', 'done'];
    const groups = { todo: [], in_progress: [], in_review: [], revision: [], done: [] };

    tasks.forEach(t => {
      if (groups[t.status]) groups[t.status].push(t);
    });

    stages.forEach(stage => {
      const container = document.getElementById(`col-${stage}`);
      const countBadge = document.getElementById(`count-${stage}`);
      if (countBadge) countBadge.textContent = groups[stage].length;
      if (!container) return;

      if (groups[stage].length === 0) {
        container.innerHTML = `
          <div class="h-28 rounded-xl border border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-600 text-xs">
            <i data-lucide="inbox" class="w-5 h-5 mb-1 opacity-40"></i>
            <span>ไม่มีงานในคอลัมน์นี้</span>
          </div>
        `;
      } else {
        container.innerHTML = groups[stage].map(task => this.createKanbanCardHTML(task)).join('');
      }
    });
  }

  createKanbanCardHTML(task) {
    const assignee = this.users.find(u => u.id === task.assignedTo) || { name: 'พี่วัฒน์ / พี่มิ้ว', avatar: '' };
    const isMyTask = this.currentUser && task.assignedTo === this.currentUser.id;

    let buColor = 'bg-purple-950/40 text-purple-300 border-purple-800/60';
    let buLabel = '🛍️ bgn square';
    if (task.bu === 'bgn squad') {
      buColor = 'bg-[#ee2726]/15 text-[#ff6b6b] border-[#ee2726]/30 font-bold';
      buLabel = '🎬 bgn squad';
    }

    let priorityClass = 'priority-medium';
    let priorityLabel = '📌 ปานกลาง';
    if (task.priority === 'urgent') {
      priorityClass = 'priority-urgent urgent-glow';
      priorityLabel = '🔥 ด่วนมาก';
    } else if (task.priority === 'high') {
      priorityClass = 'priority-high';
      priorityLabel = '⚡ ด่วนสูง';
    } else if (task.priority === 'low') {
      priorityClass = 'priority-low';
      priorityLabel = '🌱 ต่ำ';
    }

    const depts = Array.isArray(task.departments) ? task.departments : (task.department ? task.department.split(',').map(s => s.trim()) : []);
    const deptBadges = depts.map(d => `<span class="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-medium">${d}</span>`).join(' ');

    const deadlineDate = new Date(task.deadline);
    const isOverdue = deadlineDate < new Date() && task.status !== 'done';
    const deadlineStr = deadlineDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

    return `
      <div data-id="${task.id}" onclick="app.openTaskDetailModal('${task.id}')" class="kanban-card bg-[#121216] border ${isMyTask ? 'border-zinc-700 ring-1 ring-[#ee2726]/30' : 'border-zinc-800/80'} rounded-2xl p-3.5 shadow-md space-y-2.5 cursor-pointer group select-none">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-1.5">
            <span class="text-[11px] font-mono font-bold text-zinc-400 group-hover:text-white transition-colors">${task.code}</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold border ${buColor}">${buLabel}</span>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded-lg font-bold ${priorityClass}">${priorityLabel}</span>
        </div>

        <h4 class="font-bold text-xs text-zinc-100 line-clamp-2 leading-snug group-hover:text-[#ff6b6b] transition-colors">
          ${task.title}
        </h4>

        <div class="flex flex-wrap gap-1">
          ${deptBadges}
        </div>

        ${task.brief ? `<p class="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">${task.brief}</p>` : ''}

        ${task.revisionCount > 0 ? `
          <div class="flex items-center space-x-1 text-[10px] text-[#ff6b6b] font-semibold bg-[#ee2726]/10 border border-[#ee2726]/30 px-2 py-0.5 rounded-lg">
            <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
            <span>สั่งแก้ครั้งที่ ${task.revisionCount}</span>
          </div>
        ` : ''}

        <div class="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
          <div class="flex items-center space-x-1.5">
            <img src="${assignee.avatar}" class="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 object-cover" alt="${assignee.name}">
            <span class="text-zinc-300 font-medium truncate max-w-[90px] ${isMyTask ? 'text-[#ee2726] font-bold' : ''}">
              ${isMyTask ? 'ฉัน' : assignee.name}
            </span>
          </div>
          <div class="flex items-center space-x-1 ${isOverdue ? 'text-[#ff6b6b] font-bold' : 'text-zinc-400'}">
            <i data-lucide="clock" class="w-3 h-3"></i>
            <span>${deadlineStr}</span>
          </div>
        </div>
      </div>
    `;
  }

  // 12. SortableJS Drag-and-Drop Setup
  initSortable() {
    if (!window.Sortable) return;
    const stages = ['todo', 'in_progress', 'in_review', 'revision', 'done'];
    stages.forEach(stage => {
      const col = document.getElementById(`col-${stage}`);
      if (!col) return;
      new window.Sortable(col, {
        group: 'kanban',
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onEnd: async (evt) => {
          const taskId = evt.item.getAttribute('data-id');
          const newStatus = evt.to.getAttribute('data-status');
          const oldStatus = evt.from.getAttribute('data-status');
          
          if (newStatus && newStatus !== oldStatus) {
            await this.handleKanbanDropStatusChange(taskId, newStatus, oldStatus);
          }
        }
      });
    });
  }

  async handleKanbanDropStatusChange(taskId, newStatus, oldStatus) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    const isAllowed = this.canUserActOnTask(task);
    const isManager = this.currentUser && this.currentUser.role === 'manager';

    if (!isAllowed) {
      this.showToast(`🔒 แผนกของคุณ (${this.currentUser?.department}) ไม่ได้อยู่ในรายชื่อแผนกที่รับผิดชอบงานนี้ (${task.department})`, 'error');
      this.render();
      return;
    }

    if (newStatus === 'done' && !isManager) {
      this.showToast('🔒 เฉพาะหัวหน้างาน (พี่วัฒน์ / พี่มิ้ว) เท่านั้นที่มีสิทธิ์อนุมัติปิดงาน', 'error');
      this.render();
      return;
    }

    if (newStatus === 'revision' && !isManager) {
      this.showToast('🔒 เฉพาะหัวหน้างานเท่านั้นที่มีสิทธิ์สั่งแก้งาน', 'error');
      this.render();
      return;
    }

    if (newStatus === 'in_review' && !task.deliverableUrl) {
      this.selectedTaskId = taskId;
      this.openSubmitWorkModal(taskId);
      this.render();
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถเปลี่ยนสถานะได้');

      const idx = this.tasks.findIndex(t => t.id === taskId);
      if (idx !== -1) this.tasks[idx] = data;

      if (newStatus === 'done') {
        this.safeConfetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }
      this.showToast(`ย้ายงานเป็น [${this.getStatusLabel(newStatus)}] แล้ว`, 'success');
      this.render();
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
      this.render();
    }
  }

  // 13. HR LEAVE & APPRAISAL PORTAL ENGINE (🏖️ ระบบบริหารจัดการการลางาน)
  renderHRView() {
    const isManager = this.currentUser && this.currentUser.role === 'manager';
    const mgrContainer = document.getElementById('hr-manager-container');
    const mbrContainer = document.getElementById('hr-member-container');

    if (isManager) {
      if (mgrContainer) mgrContainer.classList.remove('hidden');
      if (mbrContainer) mbrContainer.classList.add('hidden');

      this.renderManagerLeavePortal();
    } else {
      if (mgrContainer) mgrContainer.classList.add('hidden');
      if (mbrContainer) mbrContainer.classList.remove('hidden');

      this.renderMemberLeavePortal();
    }

    this.safeIcons();
  }

  // Manager Leave Dashboard
  renderManagerLeavePortal() {
    if (!this.currentUser) return;

    // 1. Manager's own leave days count
    const myStats = this.calculateUserLeaveStats(this.currentUser.id);
    const mgrDaysEl = document.getElementById('hr-mgr-leave-days');
    if (mgrDaysEl) mgrDaysEl.textContent = `${myStats.quotaUsed} วัน`;

    // 2. Company-wide Leave Analytics
    const approvedLeaves = (this.leaves || []).filter(l => l.status === 'approved');
    const pendingLeaves = (this.leaves || []).filter(l => l.status === 'pending');

    const sickTotal = approvedLeaves.filter(l => l.type === 'sick').reduce((s, l) => s + (parseFloat(l.daysCount) || 1), 0);
    const personalTotal = approvedLeaves.filter(l => l.type === 'personal').reduce((s, l) => s + (parseFloat(l.daysCount) || 1), 0);
    const annualTotal = approvedLeaves.filter(l => l.type === 'annual').reduce((s, l) => s + (parseFloat(l.daysCount) || 1), 0);

    const statSick = document.getElementById('hr-stat-sick-total');
    const statPersonal = document.getElementById('hr-stat-personal-total');
    const statAnnual = document.getElementById('hr-stat-annual-total');
    const statPending = document.getElementById('hr-stat-pending-total');

    if (statSick) statSick.textContent = `${sickTotal} วัน`;
    if (statPersonal) statPersonal.textContent = `${personalTotal} วัน`;
    if (statAnnual) statAnnual.textContent = `${annualTotal} วัน`;
    if (statPending) statPending.textContent = `${pendingLeaves.length} รายการ`;

    // 3. Pending Approvals Box
    this.renderPendingLeaves();

    // 4. Employee Quota Tracker Table
    this.renderEmployeeQuotasTable();

    // 5. Master Leave Table
    this.renderMasterLeaveTable();
  }

  renderEmployeeQuotasTable() {
    const tbody = document.getElementById('table-employee-quotas-rows');
    if (!tbody) return;

    if (this.users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-6 text-zinc-500">ไม่มีข้อมูลพนักงาน</td></tr>`;
      return;
    }

    tbody.innerHTML = this.users.map(u => {
      const stats = this.calculateUserLeaveStats(u.id);
      
      let statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">🟢 ปกติ</span>`;
      if (stats.isExceeded) {
        statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">🔴 เกินโควตา</span>`;
      } else if (stats.quotaRemaining <= 1) {
        statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">🟡 เหลือ ${stats.quotaRemaining} วัน</span>`;
      }

      return `
        <tr class="hover:bg-zinc-800/40 transition-colors">
          <td class="py-3 px-4">
            <div class="flex items-center space-x-2.5">
              <img src="${u.avatar}" class="w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700 object-cover">
              <span class="font-bold text-zinc-100">${u.name}</span>
            </div>
          </td>
          <td class="py-3 px-4 text-zinc-400">${u.department} <span class="text-[10px] text-zinc-500">(${u.bu})</span></td>
          <td class="py-3 px-4 text-center font-bold text-white">${stats.quotaTotal} วัน</td>
          <td class="py-3 px-4 text-center text-amber-400 font-semibold">${stats.sickDays}</td>
          <td class="py-3 px-4 text-center text-emerald-400 font-semibold">${stats.annualDays}</td>
          <td class="py-3 px-4 text-center font-bold text-zinc-200">${stats.quotaUsed} วัน</td>
          <td class="py-3 px-4 text-center font-bold text-emerald-400 text-sm">${stats.quotaRemaining} วัน</td>
          <td class="py-3 px-4 text-center text-sky-400 font-semibold">${stats.personalDays}</td>
          <td class="py-3 px-4 text-center">${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }

  renderPendingLeaves() {
    const listEl = document.getElementById('hr-pending-leaves-list');
    const countEl = document.getElementById('hr-pending-leave-count');
    if (!listEl) return;

    const isManager = this.currentUser && this.currentUser.role === 'manager';
    const pending = (this.leaves || []).filter(l => l.status === 'pending');

    if (countEl) countEl.textContent = `${pending.length} รายการ`;

    if (pending.length === 0) {
      listEl.innerHTML = `<p class="text-xs text-zinc-500 py-6 text-center">ไม่มีคำขอลางานที่รออนุมัติ</p>`;
      return;
    }

    listEl.innerHTML = pending.map(l => {
      const requesterStats = this.calculateUserLeaveStats(l.userId);
      const isQuotaLeave = l.type === 'sick' || l.type === 'annual';
      const willExceed = isQuotaLeave && (requesterStats.quotaUsed + (parseFloat(l.daysCount) || 1) > requesterStats.quotaTotal);

      return `
        <div class="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-zinc-200">${l.userName} (${l.department || ''})</span>
            <div class="flex items-center space-x-1.5">
              <button onclick="app.shareLeaveToLine('${l.id}')" title="แชร์ใบลานี้เข้า LINE" class="p-1 rounded-lg bg-[#06C755]/15 hover:bg-[#06C755] text-[#06C755] hover:text-white border border-[#06C755]/30 text-[10px] flex items-center space-x-1 transition-all">
                <i data-lucide="share-2" class="w-3 h-3"></i>
                <span>LINE</span>
              </button>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ee2726]/15 text-[#ff6b6b] border border-[#ee2726]/30">
                ${this.getLeaveTypeLabel(l.type)}
              </span>
            </div>
          </div>
          <div class="text-zinc-400 text-[11px]">
            <p>📅 <strong>${l.startDate}</strong> ถึง <strong>${l.endDate}</strong> (${l.daysCount} วัน)</p>
            <p class="mt-0.5">💬 "${l.reason}"</p>
            ${l.attachmentUrl ? `<p class="mt-1"><a href="${l.attachmentUrl}" target="_blank" class="text-sky-400 hover:underline">🔗 ดูเอกสารแนบ / ใบรับรองแพทย์</a></p>` : ''}
          </div>
          ${willExceed ? `
            <div class="p-1.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-[10px] text-rose-300 font-semibold">
              ⚠️ คำขอนี้จะทำให้ใช้วันลาเกินโควตาประจำปี (${requesterStats.quotaUsed + parseFloat(l.daysCount)}/${requesterStats.quotaTotal} วัน)
            </div>
          ` : ''}
          ${isManager ? `
            <div class="pt-2 border-t border-zinc-900 flex items-center justify-end space-x-2">
              <button onclick="app.openRejectLeaveModal('${l.id}')" class="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 text-xs font-semibold">ไม่อนุมัติ</button>
              <button onclick="app.approveLeave('${l.id}')" class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30">อนุมัติ ✅</button>
            </div>
          ` : `<p class="text-[10px] text-amber-400">⏳ รอหัวหน้างานพิจารณา</p>`}
        </div>
      `;
    }).join('');
  }

  renderMasterLeaveTable() {
    const tbody = document.getElementById('table-master-leave-rows');
    if (!tbody) return;

    const filterEmp = document.getElementById('hr-filter-employee')?.value || 'all';
    const filterType = document.getElementById('hr-filter-type')?.value || 'all';

    let list = this.leaves || [];

    if (filterEmp !== 'all') {
      list = list.filter(l => l.userId === filterEmp);
    }
    if (filterType !== 'all') {
      list = list.filter(l => l.type === filterType);
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center py-8 text-zinc-500">ไม่มีข้อมูลประวัติการลาที่ตรงกับตัวกรอง</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(l => {
      const createdDate = l.createdAt ? new Date(l.createdAt).toLocaleDateString('th-TH') : '-';
      let statusBadge = '';
      if (l.status === 'approved') {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">✅ อนุมัติแล้ว</span>`;
      } else if (l.status === 'rejected') {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">❌ ไม่อนุมัติ</span>`;
      } else {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">⏳ รออนุมัติ</span>`;
      }

      const approverInfo = l.approvedByName ? `${l.approvedByName} (${new Date(l.approvedAt).toLocaleDateString('th-TH')})` : (l.status === 'pending' ? '-' : 'หัวหน้างาน');

      return `
        <tr class="hover:bg-zinc-800/40 transition-colors">
          <td class="py-3 px-4 font-mono text-zinc-400">${createdDate}</td>
          <td class="py-3 px-4 font-bold text-zinc-100">${l.userName}</td>
          <td class="py-3 px-4 text-zinc-400">${l.department || '-'} <span class="text-[10px] text-zinc-500">(${l.bu || ''})</span></td>
          <td class="py-3 px-4">${this.getLeaveTypeLabel(l.type)}</td>
          <td class="py-3 px-4 font-mono text-zinc-300">${l.startDate} ~ ${l.endDate}</td>
          <td class="py-3 px-4 font-bold text-white">${l.daysCount} วัน</td>
          <td class="py-3 px-4 text-zinc-300 max-w-xs truncate">${l.reason}</td>
          <td class="py-3 px-4">
            ${l.attachmentUrl ? `<a href="${l.attachmentUrl}" target="_blank" class="text-sky-400 hover:underline">คลิกเปิดดู</a>` : `<span class="text-zinc-600">-</span>`}
          </td>
          <td class="py-3 px-4">${statusBadge}</td>
          <td class="py-3 px-4 text-zinc-400">${approverInfo}</td>
        </tr>
      `;
    }).join('');
  }

  // Member Leave Dashboard (เห็นเฉพาะข้อมูลของตนเอง 100%)
  renderMemberLeavePortal() {
    if (!this.currentUser) return;

    const stats = this.calculateUserLeaveStats(this.currentUser.id);
    const myLeaves = (this.leaves || []).filter(l => l.userId === this.currentUser.id);
    const myPending = myLeaves.filter(l => l.status === 'pending');

    const quotaTotalEl = document.getElementById('hr-my-quota-total');
    const quotaUsedEl = document.getElementById('hr-my-quota-used');
    const quotaRemainingEl = document.getElementById('hr-my-quota-remaining');
    const sickSubEl = document.getElementById('hr-my-sick-sub');
    const annualSubEl = document.getElementById('hr-my-annual-sub');
    const personalDaysEl = document.getElementById('hr-my-personal-days');
    const pendingBadge = document.getElementById('hr-my-pending-badge');
    const deptTitle = document.getElementById('hr-my-dept-title');
    const quotaBar = document.getElementById('hr-my-quota-bar');
    const quotaPercent = document.getElementById('hr-my-quota-percent');
    const quotaStatusText = document.getElementById('hr-my-quota-status-text');

    if (quotaTotalEl) quotaTotalEl.textContent = stats.quotaTotal;
    if (quotaUsedEl) quotaUsedEl.textContent = stats.quotaUsed;
    if (quotaRemainingEl) quotaRemainingEl.textContent = stats.quotaRemaining;
    if (sickSubEl) sickSubEl.textContent = stats.sickDays;
    if (annualSubEl) annualSubEl.textContent = stats.annualDays;
    if (personalDaysEl) personalDaysEl.textContent = `${stats.personalDays} วัน`;
    if (pendingBadge) pendingBadge.textContent = `รออนุมัติ ${myPending.length}`;
    if (deptTitle) deptTitle.textContent = `${this.currentUser.department} (${this.currentUser.bu})`;
    if (quotaPercent) quotaPercent.textContent = `${stats.percentUsed}%`;

    if (quotaBar) {
      quotaBar.style.width = `${stats.percentUsed}%`;
      if (stats.isExceeded) {
        quotaBar.className = 'h-full bg-rose-500 transition-all duration-500 rounded-full';
      } else if (stats.quotaRemaining <= 2) {
        quotaBar.className = 'h-full bg-amber-500 transition-all duration-500 rounded-full';
      } else {
        quotaBar.className = 'h-full bg-emerald-500 transition-all duration-500 rounded-full';
      }
    }

    if (quotaStatusText) {
      if (stats.isExceeded) {
        quotaStatusText.textContent = '⚠️ ใช้วันลาเกินโควตาประจำปีแล้ว';
        quotaStatusText.className = 'text-[10px] text-rose-400 mt-1 font-bold';
      } else if (stats.quotaRemaining === 0) {
        quotaStatusText.textContent = '🔴 ใช้วันลาครบโควตาปีนี้แล้ว (0 วันคงเหลือ)';
        quotaStatusText.className = 'text-[10px] text-rose-400 mt-1 font-bold';
      } else if (stats.quotaRemaining <= 2) {
        quotaStatusText.textContent = `🟡 ใกล้หมดโควตา (เหลืออีก ${stats.quotaRemaining} วัน)`;
        quotaStatusText.className = 'text-[10px] text-amber-400 mt-1 font-bold';
      } else {
        quotaStatusText.textContent = `✓ วันลาคงเหลือ ${stats.quotaRemaining} วันสำหรับปีนี้`;
        quotaStatusText.className = 'text-[10px] text-emerald-400 mt-1 font-bold';
      }
    }

    const tbody = document.getElementById('table-my-leave-rows');
    if (!tbody) return;

    if (myLeaves.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-zinc-500">ไม่มีประวัติการยื่นขอลางานของท่าน</td></tr>`;
      return;
    }

    tbody.innerHTML = myLeaves.map(l => {
      const createdDate = l.createdAt ? new Date(l.createdAt).toLocaleDateString('th-TH') : '-';
      let statusBadge = '';
      if (l.status === 'approved') {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">✅ อนุมัติแล้ว</span>`;
      } else if (l.status === 'rejected') {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">❌ ไม่อนุมัติ</span>`;
      } else {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">⏳ รอหัวหน้าอนุมัติ</span>`;
      }

      const note = l.rejectionReason ? `เหตุผล: ${l.rejectionReason}` : (l.approvedByName ? `อนุมัติโดย: ${l.approvedByName}` : '-');

      return `
        <tr class="hover:bg-zinc-800/40 transition-colors">
          <td class="py-3 px-4 font-mono text-zinc-400">${createdDate}</td>
          <td class="py-3 px-4 font-bold text-zinc-200">${this.getLeaveTypeLabel(l.type)}</td>
          <td class="py-3 px-4 font-mono text-zinc-300">${l.startDate} ถึง ${l.endDate}</td>
          <td class="py-3 px-4 font-bold text-white">${l.daysCount} วัน</td>
          <td class="py-3 px-4 text-zinc-300 max-w-xs truncate">${l.reason}</td>
          <td class="py-3 px-4">${statusBadge}</td>
          <td class="py-3 px-4 text-zinc-400 flex items-center justify-between">
            <span>${note}</span>
            <button onclick="app.shareLeaveToLine('${l.id}')" title="แชร์เข้า LINE" class="p-1 rounded bg-[#06C755]/15 hover:bg-[#06C755] text-[#06C755] hover:text-white border border-[#06C755]/30 text-[10px] flex items-center space-x-0.5 transition-all">
              <i data-lucide="share-2" class="w-3 h-3"></i>
              <span>LINE</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 14. Print Confidential Leave Appraisal Report (สำหรับพิจารณาขึ้นเงินเดือน)
  printAppraisalReport() {
    const reportDateEl = document.getElementById('print-report-date');
    const summaryTbody = document.getElementById('print-table-summary-rows');
    const logsTbody = document.getElementById('print-table-logs-rows');
    const printContainer = document.getElementById('print-appraisal-report');

    if (!summaryTbody || !logsTbody || !printContainer) return;

    if (reportDateEl) {
      reportDateEl.textContent = new Date().toLocaleDateString('th-TH', { dateStyle: 'long' });
    }

    // 1. Generate Per-Employee Summary Rows with Individual Quotas
    summaryTbody.innerHTML = this.users.map((u, i) => {
      const stats = this.calculateUserLeaveStats(u.id);

      let evalNote = '🌟 ดีเยี่ยม (ใช้วันลาตามเกณฑ์)';
      if (stats.isExceeded) {
        evalNote = `⚠️ เกินโควตา ${stats.quotaUsed - stats.quotaTotal} วัน`;
      } else if (stats.quotaRemaining <= 1) {
        evalNote = '🟡 ใช้วันลาใกล้ครบโควตา';
      }

      return `
        <tr>
          <td style="padding: 6px; text-align: center;">${i + 1}</td>
          <td style="padding: 6px; font-weight: bold;">${u.name}</td>
          <td style="padding: 6px;">${u.department}</td>
          <td style="padding: 6px;">${u.bu}</td>
          <td style="padding: 6px; text-align: center; font-weight: bold;">${stats.quotaTotal}</td>
          <td style="padding: 6px; text-align: center;">${stats.sickDays}</td>
          <td style="padding: 6px; text-align: center;">${stats.annualDays}</td>
          <td style="padding: 6px; text-align: center; font-weight: bold;">${stats.quotaUsed}</td>
          <td style="padding: 6px; text-align: center; font-weight: bold; color: ${stats.isExceeded ? '#dc2626' : '#059669'};">${stats.quotaRemaining}</td>
          <td style="padding: 6px; text-align: center;">${stats.personalDays}</td>
          <td style="padding: 6px; text-align: center;">${evalNote}</td>
        </tr>
      `;
    }).join('');

    // 2. Generate Detailed Leave Logs
    logsTbody.innerHTML = (this.leaves || []).map(l => {
      const statusText = l.status === 'approved' ? 'อนุมัติแล้ว' : (l.status === 'rejected' ? 'ไม่อนุมัติ' : 'รอพิจารณา');
      return `
        <tr>
          <td style="padding: 5px;">${l.createdAt ? new Date(l.createdAt).toLocaleDateString('th-TH') : '-'}</td>
          <td style="padding: 5px; font-weight: bold;">${l.userName}</td>
          <td style="padding: 5px;">${this.getLeaveTypeLabel(l.type)}</td>
          <td style="padding: 5px;">${l.startDate} - ${l.endDate}</td>
          <td style="padding: 5px; text-align: center;">${l.daysCount}</td>
          <td style="padding: 5px;">${l.reason}</td>
          <td style="padding: 5px; text-align: center;">${statusText}</td>
          <td style="padding: 5px;">${l.approvedByName || '-'}</td>
        </tr>
      `;
    }).join('');

    printContainer.classList.remove('hidden');
    window.print();
    setTimeout(() => {
      printContainer.classList.add('hidden');
    }, 1000);
  }

  exportLeaveMasterCSV() {
    const list = this.leaves || [];
    if (list.length === 0) {
      this.showToast('ไม่มีข้อมูลประวัติการลาที่จะ Export', 'info');
      return;
    }

    const headers = ['Request Date', 'Employee Name', 'Department', 'Business Unit', 'Leave Type', 'Start Date', 'End Date', 'Days Count', 'Reason', 'Status', 'Approved By', 'Rejection Reason'];
    const rows = list.map(l => [
      `"${l.createdAt ? new Date(l.createdAt).toLocaleDateString('th-TH') : ''}"`,
      `"${l.userName}"`,
      `"${l.department || ''}"`,
      `"${l.bu || ''}"`,
      `"${this.getLeaveTypeLabel(l.type)}"`,
      `"${l.startDate}"`,
      `"${l.endDate}"`,
      `"${l.daysCount || 1}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      `"${l.status || ''}"`,
      `"${l.approvedByName || ''}"`,
      `"${(l.rejectionReason || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TVmunk_Confidential_Leave_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('ดาวน์โหลดรายงานประวัติการลา HR สำเร็จ 📊', 'success');
  }

  // 15. Leave Actions (Request, Approve, Reject)
  openRequestLeaveModal() {
    if (!this.currentUser) {
      this.showToast('กรุณาเข้าสู่ระบบก่อนยื่นใบลา', 'error');
      return;
    }

    const form = document.getElementById('form-request-leave');
    if (form) form.reset();

    const todayStr = new Date().toISOString().split('T')[0];
    const sInput = document.getElementById('leave-start-date');
    const eInput = document.getElementById('leave-end-date');
    if (sInput) sInput.value = todayStr;
    if (eInput) eInput.value = todayStr;

    this.openModal('modal-request-leave');
  }

  async handleRequestLeave(e) {
    e.preventDefault();
    const type = document.getElementById('leave-type').value;
    const startDate = document.getElementById('leave-start-date').value;
    const endDate = document.getElementById('leave-end-date').value;
    const period = document.getElementById('leave-period').value;
    const daysCount = parseFloat(document.getElementById('leave-days').value) || 1;
    const reason = document.getElementById('leave-reason').value.trim();
    const attachmentUrl = document.getElementById('leave-attachment').value.trim();

    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ type, startDate, endDate, period, daysCount, reason, attachmentUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ยื่นใบลาไม่สำเร็จ');

      this.closeModal('modal-request-leave');
      this.showToast('ยื่นคำขอลางานเรียบร้อยแล้วและส่งแจ้งเตือนเข้า LINE แล้ว 📋', 'success');
      this.renderHRView();
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
    }
  }

  async approveLeave(leaveId) {
    try {
      const res = await fetch(`/api/leaves/${leaveId}/status`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status: 'approved' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'อนุมัติไม่สำเร็จ');

      this.showToast('อนุมัติการลางานเรียบร้อยแล้ว ✅', 'success');
      this.renderHRView();
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
    }
  }

  openRejectLeaveModal(leaveId) {
    this.selectedLeaveId = leaveId;
    const form = document.getElementById('form-reject-leave');
    if (form) form.reset();
    this.openModal('modal-reject-leave');
  }

  async handleConfirmRejectLeave(e) {
    e.preventDefault();
    const rejectionReason = document.getElementById('leave-reject-reason').value.trim();

    try {
      const res = await fetch(`/api/leaves/${this.selectedLeaveId}/status`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status: 'rejected', rejectionReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ปฏิเสธไม่สำเร็จ');

      this.closeModal('modal-reject-leave');
      this.showToast('แจ้งผลไม่อนุมัติการลาแล้ว ❌', 'info');
      this.renderHRView();
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
    }
  }

  getLeaveTypeLabel(type) {
    const map = {
      sick: '🩺 ลาป่วย',
      personal: '💼 ลากิจ',
      annual: '🏖️ ลาพักร้อน',
      offsite: '🎬 ออกกอง'
    };
    return map[type] || type;
  }

  // 16. Table / List View Renderer
  renderList(tasks) {
    const tbody = document.getElementById('table-task-rows');
    if (!tbody) return;

    if (tasks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-zinc-500">ไม่มีข้อมูลงานที่ตรงกับตัวกรอง</td></tr>`;
      return;
    }

    tbody.innerHTML = tasks.map(t => {
      const assignee = this.users.find(u => u.id === t.assignedTo) || { name: 'พี่วัฒน์ / พี่มิ้ว', avatar: '' };
      const deadlineStr = new Date(t.deadline).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
      
      const depts = Array.isArray(t.departments) ? t.departments : (t.department ? t.department.split(',').map(s => s.trim()) : []);
      const deptPills = depts.map(d => `<span class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] mr-1 inline-block">${d}</span>`).join('');

      return `
        <tr class="hover:bg-zinc-800/40 transition-colors cursor-pointer" onclick="app.openTaskDetailModal('${t.id}')">
          <td class="py-3 px-4 font-mono font-bold text-[#ee2726]">
            ${t.code}
            <span class="block text-[10px] text-zinc-400 font-normal">${t.bu}</span>
          </td>
          <td class="py-3 px-4 font-bold text-zinc-200 max-w-xs truncate">${t.title}</td>
          <td class="py-3 px-4">${deptPills}</td>
          <td class="py-3 px-4">
            <div class="flex items-center space-x-1.5">
              <img src="${assignee.avatar}" class="w-5 h-5 rounded-full bg-zinc-800 object-cover">
              <span class="text-zinc-300 font-medium">${assignee.name}</span>
            </div>
          </td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold priority-${t.priority}">
              ${(t.priority || 'medium').toUpperCase()}
            </span>
          </td>
          <td class="py-3 px-4 text-zinc-300">${deadlineStr}</td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold status-${t.status}">
              ${this.getStatusLabel(t.status)}
            </span>
          </td>
          <td class="py-3 px-4 text-right">
            <button onclick="event.stopPropagation(); app.shareTaskToLine('${t.id}')" title="แชร์เข้า LINE" class="p-1.5 rounded-lg bg-[#06C755]/15 hover:bg-[#06C755] text-[#06C755] hover:text-white mr-1 transition-colors">
              <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="event.stopPropagation(); app.openTaskDetailModal('${t.id}')" class="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 17. Calendar View Renderer
  renderCalendar(tasks) {
    const grid = document.getElementById('calendar-grid');
    const headerTitle = document.getElementById('calendar-month-year');
    if (!grid) return;

    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();

    const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    if (headerTitle) headerTitle.textContent = `${monthNames[month]} ${year + 543}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let cellsHtml = '';

    for (let i = 0; i < firstDay; i++) {
      cellsHtml += `<div class="bg-zinc-950/40 p-2 min-h-[90px] opacity-20"></div>`;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toISOString().split('T')[0];
      const isToday = dateStr === todayStr;

      const dayTasks = tasks.filter(t => t.deadline && t.deadline.startsWith(dateStr));

      cellsHtml += `
        <div class="bg-zinc-950 p-1.5 sm:p-2 min-h-[90px] flex flex-col justify-between border-t border-zinc-900 ${isToday ? 'ring-1 ring-[#ee2726] bg-[#ee2726]/10' : ''}">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold ${isToday ? 'w-5 h-5 rounded-full bg-[#ee2726] text-white flex items-center justify-center' : 'text-zinc-400'}">${day}</span>
            ${dayTasks.length > 0 ? `<span class="text-[10px] font-bold text-[#ee2726]">${dayTasks.length} งาน</span>` : ''}
          </div>
          <div class="space-y-1 overflow-y-auto max-h-16">
            ${dayTasks.map(t => `
              <div onclick="app.openTaskDetailModal('${t.id}')" title="${t.title}" class="p-1 rounded text-[10px] font-semibold bg-zinc-900 border border-zinc-800 text-zinc-200 truncate cursor-pointer hover:border-[#ee2726] transition-colors">
                <span class="text-[#ee2726]">${t.code}</span> ${t.title}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    grid.innerHTML = cellsHtml;
  }

  prevMonth() {
    this.calendarDate.setMonth(this.calendarDate.getMonth() - 1);
    this.render();
  }

  nextMonth() {
    this.calendarDate.setMonth(this.calendarDate.getMonth() + 1);
    this.render();
  }

  // 18. Analytics & Reports
  renderAnalytics() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.status === 'done').length;
    const inReview = this.tasks.filter(t => t.status === 'in_review').length;
    const revision = this.tasks.filter(t => t.status === 'revision').length;

    const statTotal = document.getElementById('stat-total-tasks');
    const statCompleted = document.getElementById('stat-completed-tasks');
    const statPercent = document.getElementById('stat-completed-percent');
    const statReview = document.getElementById('stat-pending-review');
    const statRev = document.getElementById('stat-revision-tasks');

    if (statTotal) statTotal.textContent = total;
    if (statCompleted) statCompleted.textContent = completed;
    if (statPercent) statPercent.textContent = `อัตราสำเร็จ ${total ? Math.round((completed / total) * 100) : 0}%`;
    if (statReview) statReview.textContent = inReview;
    if (statRev) statRev.textContent = revision;

    if (!window.Chart) return;

    const buCounts = {
      'bgn square': this.tasks.filter(t => t.bu === 'bgn square').length,
      'bgn squad': this.tasks.filter(t => t.bu === 'bgn squad').length
    };

    const ctxBu = document.getElementById('chart-bu');
    if (ctxBu) {
      if (this.charts.bu) this.charts.bu.destroy();
      this.charts.bu = new window.Chart(ctxBu, {
        type: 'doughnut',
        data: {
          labels: ['🛍️ bgn square (ขายของ)', '🎬 bgn squad (สื่อ)'],
          datasets: [{
            data: [buCounts['bgn square'], buCounts['bgn squad']],
            backgroundColor: ['#a855f7', '#ee2726'],
            borderColor: '#121216',
            borderWidth: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#d4d4d8', font: { family: 'Prompt' } } }
          }
        }
      });
    }

    const depts = ['คอนเทนต์', 'กราฟิก', 'วิดีโอ/ตัดต่อ', 'การตลาด', 'แอดมิน'];
    const deptCounts = depts.map(d => this.tasks.filter(t => {
      const tDepts = Array.isArray(t.departments) ? t.departments : (t.department ? t.department.split(',').map(s => s.trim()) : []);
      return tDepts.includes(d);
    }).length);

    const ctxDept = document.getElementById('chart-dept');
    if (ctxDept) {
      if (this.charts.dept) this.charts.dept.destroy();
      this.charts.dept = new window.Chart(ctxDept, {
        type: 'bar',
        data: {
          labels: depts,
          datasets: [{
            label: 'จำนวนงานที่เกี่ยวข้อง',
            data: deptCounts,
            backgroundColor: 'rgba(238, 39, 38, 0.75)',
            borderColor: '#ee2726',
            borderWidth: 1,
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(39, 39, 42, 0.6)' }, ticks: { color: '#a1a1aa' } },
            x: { grid: { display: false }, ticks: { color: '#d4d4d8', font: { family: 'Prompt' } } }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }

  // 19. Task Modal Actions & Mini Calendar Picker
  openNewTaskModal() {
    if (!this.currentUser) {
      this.showToast('กรุณาเข้าสู่ระบบก่อนสั่งงาน', 'error');
      return;
    }

    const form = document.getElementById('form-new-task');
    if (form) form.reset();

    document.querySelectorAll('input[name="task-dept-item"]').forEach((cb, i) => {
      cb.checked = (i === 0);
    });

    // Default Deadline: Tomorrow at 18:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    
    this.pickerSelectedDate = tomorrow;
    this.pickerCurrentMonth = new Date(tomorrow);
    this.pickerSelectedTime = '18:00';

    const timeSelect = document.getElementById('picker-time-select');
    if (timeSelect) timeSelect.value = '18:00';

    this.updateDeadlineValue(tomorrow);
    this.closeDeadlinePicker();

    this.openModal('modal-new-task');
  }

  // Mini Calendar Dropdown Controls
  toggleDeadlinePicker(e) {
    if (e) e.stopPropagation();
    const popover = document.getElementById('deadline-picker-popover');
    if (!popover) return;

    const isHidden = popover.classList.contains('hidden');
    if (isHidden) {
      popover.classList.remove('hidden');
      this.renderPickerCalendar();
    } else {
      popover.classList.add('hidden');
    }
    this.safeIcons();
  }

  closeDeadlinePicker() {
    const popover = document.getElementById('deadline-picker-popover');
    if (popover) popover.classList.add('hidden');
  }

  prevPickerMonth(e) {
    if (e) e.stopPropagation();
    this.pickerCurrentMonth.setMonth(this.pickerCurrentMonth.getMonth() - 1);
    this.renderPickerCalendar();
  }

  nextPickerMonth(e) {
    if (e) e.stopPropagation();
    this.pickerCurrentMonth.setMonth(this.pickerCurrentMonth.getMonth() + 1);
    this.renderPickerCalendar();
  }

  selectPickerDay(year, month, day, e) {
    if (e) e.stopPropagation();
    const [hours, mins] = this.pickerSelectedTime.split(':');
    const newDate = new Date(year, month, day, parseInt(hours), parseInt(mins), 0);
    this.pickerSelectedDate = newDate;
    this.updateDeadlineValue(newDate);
    this.renderPickerCalendar();
  }

  handlePickerTimeChange(timeStr) {
    this.pickerSelectedTime = timeStr || '18:00';
    const [hours, mins] = this.pickerSelectedTime.split(':');
    if (this.pickerSelectedDate) {
      this.pickerSelectedDate.setHours(parseInt(hours), parseInt(mins), 0, 0);
      this.updateDeadlineValue(this.pickerSelectedDate);
    }
  }

  setDeadlinePreset(presetType, e) {
    if (e) e.stopPropagation();
    const now = new Date();
    let target = new Date();

    if (presetType === 'today-18') {
      target.setHours(18, 0, 0, 0);
    } else if (presetType === 'tomorrow-18') {
      target.setDate(target.getDate() + 1);
      target.setHours(18, 0, 0, 0);
    } else if (presetType === 'friday-18') {
      const dayOfWeek = now.getDay(); // 0 is Sun, 5 is Fri
      const daysUntilFri = (5 - dayOfWeek + 7) % 7 || 7;
      target.setDate(now.getDate() + daysUntilFri);
      target.setHours(18, 0, 0, 0);
    } else if (presetType === 'next-week') {
      const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon
      const daysUntilMon = (1 - dayOfWeek + 7) % 7 || 7;
      target.setDate(now.getDate() + daysUntilMon);
      target.setHours(18, 0, 0, 0);
    }

    this.pickerSelectedDate = target;
    this.pickerCurrentMonth = new Date(target);
    this.pickerSelectedTime = '18:00';

    const timeSelect = document.getElementById('picker-time-select');
    if (timeSelect) timeSelect.value = '18:00';

    this.updateDeadlineValue(target);
    this.renderPickerCalendar();
  }

  updateDeadlineValue(dateObj) {
    const hiddenInput = document.getElementById('task-deadline');
    const displaySpan = document.getElementById('deadline-display-text');
    if (!dateObj) return;

    if (hiddenInput) {
      hiddenInput.value = dateObj.toISOString();
    }

    if (displaySpan) {
      const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
      const monthNamesShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      
      const dayName = dayNames[dateObj.getDay()];
      const day = dateObj.getDate();
      const monthStr = monthNamesShort[dateObj.getMonth()];
      const yearBE = dateObj.getFullYear() + 543;
      const timeStr = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

      // Relative description (today / tomorrow)
      const today = new Date();
      const isToday = dateObj.toDateString() === today.toDateString();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = dateObj.toDateString() === tomorrow.toDateString();

      let prefix = `${dayName}ที่ ${day} ${monthStr} ${yearBE}`;
      if (isToday) prefix = `วันนี้ (${day} ${monthStr})`;
      if (isTomorrow) prefix = `พรุ่งนี้ (${day} ${monthStr})`;

      displaySpan.innerHTML = `<strong class="text-zinc-100">${prefix}</strong> เวลา <span class="text-[#ff6b6b] font-bold">${timeStr} น.</span>`;
    }
  }

  renderPickerCalendar() {
    const grid = document.getElementById('picker-calendar-grid');
    const headerTitle = document.getElementById('picker-month-year');
    if (!grid) return;

    const year = this.pickerCurrentMonth.getFullYear();
    const month = this.pickerCurrentMonth.getMonth();

    const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    if (headerTitle) headerTitle.textContent = `${monthNames[month]} ${year + 543}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';

    // Empty lead-in spaces before first day of month
    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div class="h-8 flex items-center justify-center text-zinc-700 text-[10px] select-none opacity-30">·</div>`;
    }

    const today = new Date();
    const selDate = this.pickerSelectedDate;

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = (today.getFullYear() === year && today.getMonth() === month && today.getDate() === d);
      const isSelected = (selDate && selDate.getFullYear() === year && selDate.getMonth() === month && selDate.getDate() === d);

      let cellClass = 'h-8 flex items-center justify-center text-xs font-semibold cursor-pointer rounded-xl transition-all select-none ';
      if (isSelected) {
        cellClass += 'bg-[#ee2726] text-white font-bold shadow-md shadow-red-600/40 scale-105 ring-1 ring-white/30';
      } else if (isToday) {
        cellClass += 'bg-[#ee2726]/15 text-[#ff6b6b] border border-[#ee2726]/40 font-bold hover:bg-[#ee2726]/25';
      } else {
        cellClass += 'text-zinc-200 hover:bg-zinc-800 hover:text-white';
      }

      html += `
        <div onclick="app.selectPickerDay(${year}, ${month}, ${d}, event)" class="${cellClass}">
          ${d}
        </div>
      `;
    }

    grid.innerHTML = html;
    this.safeIcons();
  }

  // One-Click LINE Share Engine
  shareTaskToLine(taskId) {
    const id = taskId || this.selectedTaskId;
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    const assignee = this.users.find(u => u.id === task.assignedTo) || { name: 'ทีมงาน' };
    const deadlineDate = new Date(task.deadline).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
    const priorityMap = { urgent: '🔥 ด่วนที่สุด', high: '⚡ ด่วนสูง', medium: '📌 ปานกลาง', low: '🌱 ปกติ' };

    const host = window.location.origin;
    const text = `📢 [TVmunk - bgn] แจ้งเตือนงาน!\n` +
      `------------------------\n` +
      `🏷️ รหัสงาน: ${task.code} (${task.bu})\n` +
      `📌 หัวข้อ: ${task.title}\n` +
      `👥 แผนก: ${task.department}\n` +
      `🧑‍💻 ผู้รับผิดชอบ: ${assignee.name}\n` +
      `🚨 ความสำคัญ: ${priorityMap[task.priority] || task.priority}\n` +
      `⏰ กำหนดส่ง: ${deadlineDate}\n` +
      (task.brief ? `📝 บรีฟ: "${task.brief}"\n` : '') +
      (task.referenceUrl ? `🔗 Ref: ${task.referenceUrl}\n` : '') +
      (task.deliverableUrl ? `📤 ลิงก์งาน: ${task.deliverableUrl}\n` : '') +
      `------------------------\n` +
      `👉 เปิดดูในระบบ: ${host}`;

    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(lineUrl, '_blank');
    this.showToast('เปิดแอป LINE เพื่อเลือกกลุ่มหรือห้องแชทส่งงานแล้ว 📲', 'success');
  }

  shareLeaveToLine(leaveId) {
    const id = leaveId || this.selectedLeaveId;
    const leave = this.leaves.find(l => l.id === id) || (this.leaves && this.leaves[0]);
    if (!leave) return;

    const periodText = leave.period === 'morning' ? 'ครึ่งวันเช้า' : (leave.period === 'afternoon' ? 'ครึ่งวันบ่าย' : 'เต็มวัน');
    const host = window.location.origin;
    const text = `📋 [TVmunk - bgn] แจ้งการขอลางาน\n` +
      `------------------------\n` +
      `👤 พนักงาน: ${leave.userName} (${leave.department || ''})\n` +
      `📌 ประเภท: ${this.getLeaveTypeLabel(leave.type)}\n` +
      `📅 วันที่ลา: ${leave.startDate} ถึง ${leave.endDate} (${periodText} - ${leave.daysCount} วัน)\n` +
      `📝 เหตุผล: "${leave.reason}"\n` +
      `------------------------\n` +
      `👉 หัวหน้างานตรวจอนุมัติได้ที่: ${host}`;

    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(lineUrl, '_blank');
    this.showToast('เปิดแอป LINE เพื่อส่งใบลาแล้ว 📲', 'success');
  }

  async handleCreateTask(e) {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const bu = document.getElementById('task-bu').value;
    
    const checkedDepts = Array.from(document.querySelectorAll('input[name="task-dept-item"]:checked')).map(cb => cb.value);
    if (checkedDepts.length === 0) {
      this.showToast('กรุณาเลือกแผนกที่รับผิดชอบอย่างน้อย 1 แผนก', 'error');
      return;
    }

    const assignedTo = document.getElementById('task-assignee').value;
    const priority = document.getElementById('task-priority').value;
    const deadlineVal = document.getElementById('task-deadline').value || new Date().toISOString();
    const deadline = new Date(deadlineVal).toISOString();
    const brief = document.getElementById('task-brief').value;
    const referenceUrl = document.getElementById('task-ref').value;
    const assetUrl = document.getElementById('task-asset').value;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          title,
          bu,
          departments: checkedDepts,
          department: checkedDepts.join(', '),
          assignedTo,
          priority,
          deadline,
          brief,
          referenceUrl,
          assetUrl
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create task');
      }

      const newTask = await res.json();
      this.closeModal('modal-new-task');
      this.showToast(`สร้างงาน "${newTask.title}" เรียบร้อยแล้ว`, 'success');
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
    }
  }

  openTaskDetailModal(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    this.selectedTaskId = taskId;
    this.renderTaskDetail(task);
    this.openModal('modal-task-detail');
    this.safeIcons();
  }

  renderTaskDetail(task) {
    const assignee = this.users.find(u => u.id === task.assignedTo) || { name: 'พี่วัฒน์ / พี่มิ้ว', avatar: '' };
    const assigner = this.users.find(u => u.id === task.assignedBy) || { name: 'หัวหน้างาน' };
    const deadlineStr = new Date(task.deadline).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' });

    const depts = Array.isArray(task.departments) ? task.departments : (task.department ? task.department.split(',').map(s => s.trim()) : []);
    const deptPills = depts.map(d => `<span class="px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold mr-1 text-[11px]">${d}</span>`).join('');

    const header = document.getElementById('detail-header');
    if (header) {
      header.innerHTML = `
        <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div class="flex items-center space-x-2">
            <span class="text-xs font-mono font-bold text-[#ee2726] bg-[#ee2726]/10 px-2 py-0.5 rounded border border-[#ee2726]/30">${task.code}</span>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold border ${task.bu === 'bgn squad' ? 'bg-[#ee2726]/15 text-[#ff6b6b] border-[#ee2726]/30' : 'bg-purple-950/40 text-purple-300 border-purple-800/60'}">${task.bu}</span>
            <span class="text-xs px-2.5 py-0.5 rounded-lg font-bold priority-${task.priority}">ความด่วน: ${(task.priority || 'medium').toUpperCase()}</span>
          </div>

          <button onclick="app.shareTaskToLine('${task.id}')" class="px-3 py-1.5 rounded-xl bg-[#06C755]/15 hover:bg-[#06C755] text-[#06C755] hover:text-white border border-[#06C755]/30 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95">
            <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
            <span>แชร์เข้า LINE</span>
          </button>
        </div>

        <h3 class="text-xl font-bold text-zinc-100 mb-2">${task.title}</h3>
        <div class="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
          <div class="flex items-center space-x-1.5">
            <img src="${assignee.avatar}" class="w-5 h-5 rounded-full bg-zinc-800 object-cover">
            <span>ผู้รับผิดชอบ: <strong class="text-zinc-200">${assignee.name}</strong></span>
          </div>
          <div>แผนกที่รับผิดชอบ: ${deptPills}</div>
          <div>ผู้สั่งงาน: <strong class="text-zinc-200">${assigner.name}</strong></div>
          <div class="flex items-center space-x-1 text-zinc-300">
            <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-400"></i>
            <span>กำหนดส่ง: ${deadlineStr}</span>
          </div>
        </div>
      `;
    }

    const briefEl = document.getElementById('detail-brief');
    if (briefEl) briefEl.textContent = task.brief || 'ไม่มีรายละเอียดเพิ่มเติม';

    const refLink = document.getElementById('detail-ref-link');
    if (refLink) {
      if (task.referenceUrl) {
        refLink.href = task.referenceUrl;
        refLink.textContent = task.referenceUrl;
      } else {
        refLink.href = '#';
        refLink.textContent = 'ไม่มี Reference แนบมา';
      }
    }

    const assetLink = document.getElementById('detail-asset-link');
    if (assetLink) {
      if (task.assetUrl) {
        assetLink.href = task.assetUrl;
        assetLink.textContent = task.assetUrl;
      } else {
        assetLink.href = '#';
        assetLink.textContent = 'ไม่มีโฟลเดอร์ไฟล์แนบมา';
      }
    }

    const subContent = document.getElementById('detail-submission-content');
    if (subContent) {
      if (task.deliverableUrl) {
        const submittedTime = task.submittedAt ? new Date(task.submittedAt).toLocaleString('th-TH') : '-';
        subContent.innerHTML = `
          <div class="space-y-2 text-xs">
            <div class="flex items-center space-x-2">
              <span class="text-zinc-400 font-medium">🔗 ลิงก์ผลงาน:</span>
              <a href="${task.deliverableUrl}" target="_blank" class="text-sky-400 hover:underline font-bold break-all">${task.deliverableUrl}</a>
            </div>
            ${task.submitNote ? `<p class="text-zinc-300 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">💬 <em>"${task.submitNote}"</em></p>` : ''}
            <p class="text-[11px] text-zinc-500">ส่งตรวจเมื่อ: ${submittedTime}</p>
          </div>
        `;
      } else {
        subContent.innerHTML = `<p class="text-xs text-zinc-500">ยังไม่มีการส่งมอบงาน</p>`;
      }
    }

    const revCount = document.getElementById('detail-revision-count');
    const revList = document.getElementById('detail-revision-list');
    if (revCount) revCount.textContent = `${task.revisionCount || 0} รอบ`;
    if (revList) {
      if (!task.revisions || task.revisions.length === 0) {
        revList.innerHTML = `<p class="text-xs text-zinc-500">ไม่มีประวัติการส่งแก้ไข</p>`;
      } else {
        revList.innerHTML = task.revisions.map(r => `
          <div class="p-3 rounded-xl bg-[#ee2726]/10 border border-[#ee2726]/30 text-xs space-y-1">
            <div class="flex items-center justify-between text-[#ff6b6b] font-bold">
              <span>รอบที่ ${r.round} (โดย ${r.requestedByName})</span>
              <span class="text-[10px] text-zinc-400">${new Date(r.requestedAt).toLocaleString('th-TH')}</span>
            </div>
            <p class="text-zinc-200 leading-relaxed font-sans">"${r.feedback}"</p>
          </div>
        `).join('');
      }
    }

    const actList = document.getElementById('detail-activities-list');
    if (actList) {
      actList.innerHTML = (task.activities || []).map(a => `
        <div class="flex items-start space-x-2 pb-2 border-b border-zinc-900/80">
          <span class="w-1.5 h-1.5 rounded-full bg-[#ee2726] mt-1.5 flex-shrink-0"></span>
          <div class="flex-1">
            <p class="text-zinc-200"><strong>${a.userName}:</strong> ${a.details}</p>
            <p class="text-[10px] text-zinc-500">${new Date(a.timestamp).toLocaleString('th-TH')}</p>
          </div>
        </div>
      `).join('');
    }

    this.renderTaskActionButtons(task);
  }

  canUserActOnTask(task) {
    if (!task || !this.currentUser) return false;
    if (this.currentUser.role === 'manager') return true;
    if (task.assignedTo === this.currentUser.id) return true;

    const taskDepts = Array.isArray(task.departments)
      ? task.departments
      : (task.department ? task.department.split(',').map(d => d.trim()) : []);

    const userDept = this.currentUser.department;
    if (userDept && taskDepts.some(d => 
      d.toLowerCase() === userDept.toLowerCase() || 
      userDept.toLowerCase().includes(d.toLowerCase()) || 
      d.toLowerCase().includes(userDept.toLowerCase())
    )) {
      return true;
    }

    return false;
  }

  renderTaskActionButtons(task) {
    const bar = document.getElementById('detail-action-bar');
    if (!bar) return;

    const isManager = this.currentUser && this.currentUser.role === 'manager';
    const isAllowed = this.canUserActOnTask(task);
    const isAssignee = this.currentUser && task.assignedTo === this.currentUser.id;

    let html = `
      <div class="flex items-center space-x-2">
        <span class="text-xs text-zinc-400">สถานะ:</span>
        <span class="px-2.5 py-1 rounded-full text-xs font-bold status-${task.status}">${this.getStatusLabel(task.status)}</span>
      </div>
      <div class="flex items-center space-x-2 flex-wrap">
    `;

    if (task.status === 'todo') {
      if (isAllowed) {
        html += `
          <button onclick="app.updateTaskStatusDirect('${task.id}', 'in_progress')" class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-amber-600/30 transition-all active:scale-95">
            <i data-lucide="play" class="w-3.5 h-3.5"></i>
            <span>กดรับงาน (เริ่มทำ)</span>
          </button>
        `;
      } else {
        html += `<span class="text-[11px] text-zinc-500">🔒 รอแผนกที่รับผิดชอบ (${task.department}) หรือผู้รับผิดชอบกดรับงาน</span>`;
      }
    }

    if (task.status === 'in_progress' || task.status === 'revision') {
      if (isAllowed) {
        html += `
          <button onclick="app.openSubmitWorkModal('${task.id}')" class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-sky-600/30 transition-all active:scale-95">
            <i data-lucide="upload" class="w-3.5 h-3.5"></i>
            <span>ส่งงานให้ตรวจ (Submit)</span>
          </button>
        `;
      } else {
        html += `<span class="text-[11px] text-zinc-500">🔒 กำลังดำเนินงานโดยแผนก ${task.department}</span>`;
      }
    }

    if (task.status === 'in_review') {
      if (isManager) {
        html += `
          <button onclick="app.openRequestRevisionModal('${task.id}')" class="px-3.5 py-2 rounded-xl bg-[#ee2726]/80 hover:bg-[#ee2726] text-white text-xs font-bold flex items-center space-x-1.5">
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
            <span>สั่งส่งกลับแก้ไข</span>
          </button>
          <button onclick="app.approveTaskDirect('${task.id}')" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/30">
            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
            <span>อนุมัติผ่านงาน (Approve) 🎉</span>
          </button>
        `;
      } else {
        html += `<span class="text-[11px] text-zinc-400 font-medium">⏳ ส่งงานแล้ว อยู่ระหว่างรอหัวหน้างาน (พี่วัฒน์ / พี่มิ้ว) ตรวจสอบ</span>`;
      }
    }

    if (task.status === 'done') {
      html += `
        <span class="text-xs text-emerald-400 font-bold flex items-center">
          <i data-lucide="check" class="w-4 h-4 mr-1"></i> งานนี้เสร็จสมบูรณ์เรียบร้อยแล้ว
        </span>
      `;
    }

    // Direct Share to LINE
    html += `
      <button onclick="app.shareTaskToLine('${task.id}')" title="แชร์สรุปงานนี้เข้าห้องแชท LINE" class="px-3 py-2 rounded-xl bg-[#06C755]/15 hover:bg-[#06C755] text-[#06C755] hover:text-white border border-[#06C755]/30 text-xs font-bold flex items-center space-x-1.5 transition-all active:scale-95">
        <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
        <span>แชร์เข้า LINE</span>
      </button>
    `;

    if (isManager) {
      html += `
        <button onclick="app.confirmDeleteTask('${task.id}')" title="ลบงานนี้ (เฉพาะหัวหน้า)" class="p-2 rounded-xl bg-zinc-900 hover:bg-[#ee2726]/20 text-zinc-400 hover:text-[#ff6b6b] border border-zinc-800 transition-colors">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      `;
    }

    html += `</div>`;
    bar.innerHTML = html;
  }

  async updateTaskStatusDirect(taskId, newStatus) {
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถเปลี่ยนสถานะได้');

      const idx = this.tasks.findIndex(t => t.id === taskId);
      if (idx !== -1) this.tasks[idx] = data;

      this.renderTaskDetail(data);
      this.render();
      this.showToast(`เปลี่ยนสถานะเป็น [${this.getStatusLabel(newStatus)}] แล้ว`, 'success');
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
    }
  }

  async approveTaskDirect(taskId) {
    await this.updateTaskStatusDirect(taskId, 'done');
    this.safeConfetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
  }

  openSubmitWorkModal(taskId) {
    this.selectedTaskId = taskId;
    const form = document.getElementById('form-submit-work');
    if (form) form.reset();
    this.openModal('modal-submit-work');
  }

  async handleConfirmSubmitWork(e) {
    e.preventDefault();
    const deliverableUrl = document.getElementById('submit-url').value;
    const submitNote = document.getElementById('submit-note').value;

    try {
      const res = await fetch(`/api/tasks/${this.selectedTaskId}/status`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          status: 'in_review',
          deliverableUrl,
          submitNote
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการส่งงาน');

      const idx = this.tasks.findIndex(t => t.id === this.selectedTaskId);
      if (idx !== -1) this.tasks[idx] = data;

      this.closeModal('modal-submit-work');
      if (this.selectedTaskId) this.renderTaskDetail(data);
      this.render();
      this.showToast('ส่งงานให้หัวหน้าตรวจเรียบร้อยแล้ว 📤', 'success');
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
    }
  }

  openRequestRevisionModal(taskId) {
    this.selectedTaskId = taskId;
    const form = document.getElementById('form-request-revision');
    if (form) form.reset();
    this.openModal('modal-request-revision');
  }

  async handleConfirmRevision(e) {
    e.preventDefault();
    const feedback = document.getElementById('revision-feedback').value;

    try {
      const res = await fetch(`/api/tasks/${this.selectedTaskId}/status`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status: 'revision', feedback })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการสั่งแก้งาน');

      const idx = this.tasks.findIndex(t => t.id === this.selectedTaskId);
      if (idx !== -1) this.tasks[idx] = data;

      this.closeModal('modal-request-revision');
      if (this.selectedTaskId) this.renderTaskDetail(data);
      this.render();
      this.showToast('ส่งกลับแก้ไขและแจ้งเตือนเข้า LINE แล้ว 🔄', 'info');
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
    }
  }

  async confirmDeleteTask(taskId) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบใบงานนี้?')) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถลบใบงานได้');

      this.tasks = this.tasks.filter(t => t.id !== taskId);
      this.closeModal('modal-task-detail');
      this.render();
      this.showToast('ลบใบงานเรียบร้อยแล้ว', 'info');
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
    }
  }

  // 20. Settings & LINE Integration
  handleToggleLineEnable(checked) {
    const badge = document.getElementById('setting-line-status-badge');
    if (badge) {
      if (checked) {
        badge.className = 'text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#06C755]/20 text-[#06C755] border border-[#06C755]/40';
        badge.textContent = '🟢 เปิดใช้งาน';
      } else {
        badge.className = 'text-[10px] px-2 py-0.5 rounded-full font-bold bg-zinc-800 text-zinc-400 border border-zinc-700';
        badge.textContent = '⚪ ปิดอยู่';
      }
    }
  }

  openSettingsModal() {
    const lineEnable = document.getElementById('setting-line-enable');
    const lineBotToken = document.getElementById('setting-line-bot-token');
    const lineTargetId = document.getElementById('setting-line-target-id');
    const lineWebhook = document.getElementById('setting-line-webhook');
    const lineToken = document.getElementById('setting-line-token');
    const feedback = document.getElementById('line-test-feedback');

    if (feedback) feedback.classList.add('hidden');

    if (lineEnable) {
      lineEnable.checked = this.settings.enableLineNotify || false;
      this.handleToggleLineEnable(lineEnable.checked);
    }
    if (lineBotToken) lineBotToken.value = this.settings.lineBotToken || '';
    if (lineTargetId) lineTargetId.value = this.settings.lineTargetId || '';
    if (lineWebhook) lineWebhook.value = this.settings.lineWebhookUrl || '';
    if (lineToken) lineToken.value = this.settings.lineNotifyToken || '';

    const ipList = document.getElementById('office-ip-list');
    if (ipList && this.serverInfo.localIps) {
      ipList.innerHTML = this.serverInfo.localIps.map(ip => `
        <div class="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
          <span class="font-mono text-[#ff6b6b] font-bold">http://${ip}:${this.serverInfo.port || 3000}</span>
          <button type="button" onclick="app.copyToClipboard('http://${ip}:${this.serverInfo.port || 3000}')" class="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300">
            คัดลอกลิงก์
          </button>
        </div>
      `).join('');
    }

    this.openModal('modal-settings');
  }

  async handleSaveSettings(e) {
    e.preventDefault();
    const enableLineNotify = document.getElementById('setting-line-enable').checked;
    const lineBotToken = document.getElementById('setting-line-bot-token').value.trim();
    const lineTargetId = document.getElementById('setting-line-target-id').value.trim();
    const lineWebhookUrl = document.getElementById('setting-line-webhook').value.trim();
    const lineNotifyToken = document.getElementById('setting-line-token').value.trim();

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ enableLineNotify, lineBotToken, lineTargetId, lineWebhookUrl, lineNotifyToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถบันทึกการตั้งค่าได้');

      this.settings = data;
      this.closeModal('modal-settings');
      this.showToast('บันทึกการตั้งค่า LINE เรียบร้อยแล้ว 💾', 'success');
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
    }
  }

  async testLineNotification() {
    const feedback = document.getElementById('line-test-feedback');
    try {
      this.showToast('กำลังส่งข้อความทดสอบเข้า LINE...', 'info');
      if (feedback) {
        feedback.className = 'p-3 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-700 text-zinc-300 flex items-center space-x-2';
        feedback.innerHTML = `<span>⏳ กำลังทดสอบส่งข้อความไปยัง LINE...</span>`;
        feedback.classList.remove('hidden');
      }

      const res = await fetch('/api/settings/test-line', { method: 'POST' });
      const result = await res.json();

      if (result.success) {
        const methodMap = { messaging_api: 'LINE Official Account Bot', webhook: 'Custom Webhook', line_notify: 'LINE Notify' };
        const methodStr = methodMap[result.method] || 'LINE';
        if (feedback) {
          feedback.className = 'p-3 rounded-xl text-xs font-semibold bg-emerald-950/80 border border-emerald-500/50 text-emerald-200';
          feedback.innerHTML = `✅ ส่งข้อความทดสอบสำเร็จผ่าน <strong>${methodStr}</strong> เรียบร้อยแล้ว! (ตรวจสอบในแชท LINE)`;
        }
        this.showToast('ส่งข้อความทดสอบเข้า LINE สำเร็จ! ✅', 'success');
      } else {
        let msg = 'ไม่สามารถส่งข้อความได้';
        if (result.reason === 'disabled') {
          msg = '⚠️ ระบบปิดการแจ้งเตือนอยู่ กรุณาเปิดสวิตช์ "เปิดใช้งานการส่งแจ้งเตือนเข้า LINE Group อัตโนมัติ" ด้านบน';
        } else if (result.reason === 'No token or webhook configured') {
          msg = '⚠️ ยังไม่ได้กรอก Token หรือ Webhook URL กรุณาใส่ข้อมูลในช่องที่ 1 หรือ 2 หรือ 3 แล้วกดบันทึก';
        }
        if (feedback) {
          feedback.className = 'p-3 rounded-xl text-xs font-semibold bg-rose-950/80 border border-rose-500/50 text-rose-200';
          feedback.innerHTML = msg;
        }
        this.showToast(msg, 'error');
      }
    } catch (err) {
      console.error(err);
      if (feedback) {
        feedback.className = 'p-3 rounded-xl text-xs font-semibold bg-rose-950/80 border border-rose-500/50 text-rose-200';
        feedback.innerHTML = `❌ เกิดข้อผิดพลาด: ${err.message}`;
      }
      this.showToast('การส่งข้อความทดสอบล้มเหลว', 'error');
    }
  }

  // 21. Add New User Modal (Manager only)
  openAddUserModal() {
    const form = document.getElementById('form-add-user');
    if (form) form.reset();
    const quotaInput = document.getElementById('new-user-quota');
    if (quotaInput) quotaInput.value = '0';
    this.closeModal('user-menu');
    this.openModal('modal-add-user');
  }

  async handleAddUser(e) {
    e.preventDefault();
    const name = document.getElementById('new-user-name').value.trim();
    const role = document.getElementById('new-user-role').value;
    const bu = document.getElementById('new-user-bu').value;
    const department = document.getElementById('new-user-dept').value;
    const quotaInputVal = document.getElementById('new-user-quota')?.value;
    const leaveQuota = quotaInputVal !== '' ? parseFloat(quotaInputVal) : 0;
    const pin = document.getElementById('new-user-pin').value.trim() || '1234';

    // Generate cute Meeple avatar with random color & face
    const colors = ['red', 'pink', 'purple', 'orange', 'blue', 'green', 'yellow', 'teal', 'indigo', 'rose', 'violet', 'amber'];
    const faces = ['happy', 'wink', 'cool', 'blush', 'sparkle', 'glasses'];
    const accessories = ['none', 'star', 'bowtie', 'tie', 'flower'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomFace = faces[Math.floor(Math.random() * faces.length)];
    const randomAcc = accessories[Math.floor(Math.random() * accessories.length)];
    const avatar = generateMeepleSvg({ color: randomColor, face: randomFace, accessory: randomAcc });

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ name, role, bu, department, leaveQuota, pin, avatar, joinedYear: new Date().getFullYear(), joinedDate: new Date().toISOString().split('T')[0] })
      });
      const newUser = await res.json();
      if (!res.ok) throw new Error(newUser.error || 'ไม่สามารถเพิ่มสมาชิกได้');

      this.users.push(newUser);
      this.populateSelectDropdowns();
      this.populateLoginUserPresets();
      this.renderTeamMembersList();
      this.closeModal('modal-add-user');
      this.showToast(`เพิ่มสมาชิก "${newUser.name}" (โควตาตั้งต้น: ${leaveQuota} วัน) เรียบร้อยแล้ว`, 'success');
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
    }
  }

  // 22. Notification Bell Dropdown
  toggleNotificationDropdown(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const menu = document.getElementById('notif-menu');
    const userMenu = document.getElementById('user-menu');
    if (userMenu) userMenu.classList.add('hidden');
    if (!menu) return;

    menu.classList.toggle('hidden');
    if (!menu.classList.contains('hidden')) {
      this.renderNotificationList();
    }
  }

  getUserNotifications() {
    if (!this.currentUser) return this.notifications || [];
    return (this.notifications || []).filter(n => {
      if (!n.targetUserId && !n.targetRole) return true;
      if (n.targetUserId && n.targetUserId === this.currentUser.id) return true;
      if (n.targetRole && n.targetRole === this.currentUser.role) return true;
      return false;
    });
  }

  renderNotificationBadge() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    const myNotifs = this.getUserNotifications();
    const unread = myNotifs.filter(n => !n.isRead);
    if (unread.length > 0) {
      badge.textContent = unread.length > 99 ? '99+' : unread.length;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  renderNotificationList() {
    const list = document.getElementById('notif-list');
    if (!list) return;

    const myNotifs = this.getUserNotifications();

    if (myNotifs.length === 0) {
      list.innerHTML = `
        <div class="py-8 px-4 text-center">
          <div class="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto mb-2 text-lg">
            🔔
          </div>
          <p class="text-xs font-semibold text-zinc-400">ยังไม่มีการแจ้งเตือน</p>
          <p class="text-[10px] text-zinc-500 mt-0.5">เมื่อมีงานใหม่ คำขอลา หรือข้อความ ระบบจะแจ้งเตือนที่นี่</p>
        </div>
      `;
      return;
    }

    list.innerHTML = myNotifs.map(n => {
      let icon = 'bell';
      let iconColor = 'text-[#ee2726]';
      if (n.type && n.type.includes('task')) { icon = 'check-square'; iconColor = 'text-sky-400'; }
      else if (n.type && n.type.includes('leave')) { icon = 'calendar'; iconColor = 'text-amber-400'; }

      return `
        <div onclick="app.handleClickNotification('${n.id}', '${n.taskId || ''}')" class="p-3.5 hover:bg-zinc-800/80 cursor-pointer transition-all ${n.isRead ? 'opacity-60 bg-transparent' : 'bg-[#ee2726]/10 border-l-2 border-[#ee2726]'}">
          <div class="flex items-start space-x-2.5">
            <div class="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 ${iconColor} flex-shrink-0 mt-0.5">
              <i data-lucide="${icon}" class="w-3.5 h-3.5"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1 mb-0.5">
                <p class="text-xs font-bold text-zinc-100 truncate">${n.title || 'การแจ้งเตือน'}</p>
                <span class="text-[10px] text-zinc-500 flex-shrink-0">${new Date(n.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p class="text-[11px] text-zinc-400 leading-snug break-words">${n.message || ''}</p>
              ${n.taskId ? `<span class="inline-block mt-1 text-[10px] text-sky-400 font-semibold hover:underline">คลิกเพื่อดูรายละเอียดงาน →</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.safeIcons();
  }

  async handleClickNotification(notifId, taskId) {
    try {
      await fetch(`/api/notifications/${notifId}/read`, { method: 'POST' });
    } catch (e) {}

    const n = this.notifications.find(x => x.id === notifId);
    if (n) n.isRead = true;
    this.renderNotificationBadge();
    this.closeModal('notif-menu');

    if (taskId && taskId !== 'null' && taskId !== 'undefined') {
      this.openTaskDetailModal(taskId);
    }
  }

  async markAllNotifsRead() {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch (e) {}

    const myNotifs = this.getUserNotifications();
    myNotifs.forEach(n => n.isRead = true);
    this.renderNotificationBadge();
    this.renderNotificationList();
    this.showToast('อ่านการแจ้งเตือนทั้งหมดแล้ว ✅', 'info');
  }

  toggleUserMenu(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const menu = document.getElementById('user-menu');
    const notifMenu = document.getElementById('notif-menu');
    if (notifMenu) notifMenu.classList.add('hidden');
    if (!menu) return;

    menu.classList.toggle('hidden');
  }

  // 23. Utility Helpers & Keyboard Shortcuts
  getStatusLabel(status) {
    const map = {
      todo: '📥 รอคิว (To Do)',
      in_progress: '⏳ กำลังทำ',
      in_review: '🔍 รอตรวจ (Review)',
      revision: '🔄 สั่งแก้ไข',
      done: '✅ เสร็จสมบูรณ์'
    };
    return map[status] || status;
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
    this.safeIcons();
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
  }

  setupEventListeners() {
    window.addEventListener('click', (e) => {
      const notifMenu = document.getElementById('notif-menu');
      const userMenu = document.getElementById('user-menu');
      const deadlinePopover = document.getElementById('deadline-picker-popover');
      const deadlineTrigger = document.getElementById('btn-deadline-trigger');

      if (notifMenu && !notifMenu.contains(e.target) && !e.target.closest('#btn-notif-toggle')) {
        notifMenu.classList.add('hidden');
      }
      if (userMenu && !userMenu.contains(e.target) && !e.target.closest('#btn-user-menu-toggle')) {
        userMenu.classList.add('hidden');
      }
      if (deadlinePopover && !deadlinePopover.contains(e.target) && !deadlineTrigger?.contains(e.target)) {
        deadlinePopover.classList.add('hidden');
      }
    });

    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        this.toggleMyTasksQuickFilter();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    });
  }

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast(`คัดลอกลิงก์ "${text}" แล้ว`, 'success');
    });
  }

  // -------------------------------------------------------------
  // 24. REAL-TIME TEAM CHAT ENGINE (ห้องแชททีม & แชทส่วนตัว)
  // -------------------------------------------------------------
  renderChatView() {
    this.renderChatSidebar();
    this.loadChatMessages(this.activeChatChannel);
    const input = document.getElementById('chat-message-input');
    if (input) setTimeout(() => input.focus(), 150);
  }

  handleChatSearch(query) {
    this.chatSearchQuery = (query || '').toLowerCase().trim();
    this.renderChatSidebar();
  }

  renderChatSidebar() {
    const publicContainer = document.getElementById('chat-public-channels');
    const dmContainer = document.getElementById('chat-dm-channels');
    if (!publicContainer || !dmContainer) return;

    // 1. Render Public Channels
    const publicChannels = [
      { id: 'general', name: 'รวมทีม TVmunk - bgn', icon: '🏢', desc: 'ห้องพูดคุยหลักของทุกคนในออฟฟิศ' },
      { id: 'square', name: 'bgn square', icon: '🛍️', desc: 'ห้องพูดคุยทีมขาย / E-Commerce' },
      { id: 'squad', name: 'bgn squad', icon: '🎬', desc: 'ห้องพูดคุยทีม Production / สื่อ' }
    ];

    const filteredPublic = publicChannels.filter(c => 
      !this.chatSearchQuery || c.name.toLowerCase().includes(this.chatSearchQuery) || c.desc.toLowerCase().includes(this.chatSearchQuery)
    );

    publicContainer.innerHTML = filteredPublic.map(c => {
      const isActive = this.activeChatChannel === c.id;
      return `
        <div onclick="app.switchChatChannel('${c.id}')" class="p-2.5 rounded-2xl flex items-center space-x-3 cursor-pointer transition-all ${isActive ? 'bg-[#ee2726]/15 border border-[#ee2726]/40 text-white font-bold' : 'hover:bg-zinc-900 text-zinc-300 border border-transparent'}">
          <span class="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm flex-shrink-0">${c.icon}</span>
          <div class="truncate flex-1">
            <p class="text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-zinc-200'}">${c.name}</p>
            <p class="text-[10px] text-zinc-500 truncate">${c.desc}</p>
          </div>
        </div>
      `;
    }).join('');

    // 2. Render Direct Messages (Other Team Members)
    const otherUsers = (this.users || []).filter(u => !this.currentUser || u.id !== this.currentUser.id);
    const filteredUsers = otherUsers.filter(u => 
      !this.chatSearchQuery || u.name.toLowerCase().includes(this.chatSearchQuery) || u.department.toLowerCase().includes(this.chatSearchQuery)
    );

    if (filteredUsers.length === 0) {
      dmContainer.innerHTML = `<p class="text-[11px] text-zinc-600 py-2 px-2">ไม่พบรายชื่อเพื่อนร่วมงาน</p>`;
    } else {
      dmContainer.innerHTML = filteredUsers.map(u => {
        const dmChannelId = this.currentUser ? this.getDirectChannelId(this.currentUser.id, u.id) : `dm_${u.id}`;
        const isActive = this.activeChatChannel === dmChannelId;
        const isManager = u.role === 'manager';

        return `
          <div onclick="app.switchChatChannel('${dmChannelId}')" class="p-2.5 rounded-2xl flex items-center space-x-3 cursor-pointer transition-all ${isActive ? 'bg-[#ee2726]/15 border border-[#ee2726]/40 text-white font-bold' : 'hover:bg-zinc-900 text-zinc-300 border border-transparent'}">
            <div class="relative flex-shrink-0">
              <img src="${u.avatar}" class="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 object-cover">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950 absolute -bottom-0.5 -right-0.5"></span>
            </div>
            <div class="truncate flex-1">
              <div class="flex items-center space-x-1.5 truncate">
                <span class="text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-zinc-200'}">${u.name}</span>
                ${isManager ? `<span class="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">👑</span>` : ''}
              </div>
              <p class="text-[10px] text-zinc-500 truncate">${u.department} • ${u.bu}</p>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  getDirectChannelId(userId1, userId2) {
    const sorted = [userId1, userId2].sort();
    return `dm_${sorted[0]}_${sorted[1]}`;
  }

  async switchChatChannel(channelId) {
    this.activeChatChannel = channelId;
    this.renderChatSidebar();

    // Update Chat Header Info
    const iconEl = document.getElementById('chat-active-icon');
    const titleEl = document.getElementById('chat-active-title');
    const badgeEl = document.getElementById('chat-active-badge');
    const descEl = document.getElementById('chat-active-desc');

    if (channelId === 'general') {
      if (iconEl) iconEl.textContent = '🏢';
      if (titleEl) titleEl.textContent = 'รวมทีม TVmunk - bgn';
      if (badgeEl) { badgeEl.textContent = 'ห้องสาธารณะ'; badgeEl.className = 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold'; }
      if (descEl) descEl.textContent = 'ห้องพูดคุยหลักของทุกคนในออฟฟิศ';
    } else if (channelId === 'square') {
      if (iconEl) iconEl.textContent = '🛍️';
      if (titleEl) titleEl.textContent = 'bgn square';
      if (badgeEl) { badgeEl.textContent = 'E-Commerce'; badgeEl.className = 'text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold'; }
      if (descEl) descEl.textContent = 'ห้องพูดคุยทีมขายและจัดการสินค้า';
    } else if (channelId === 'squad') {
      if (iconEl) iconEl.textContent = '🎬';
      if (titleEl) titleEl.textContent = 'bgn squad';
      if (badgeEl) { badgeEl.textContent = 'Production / Media'; badgeEl.className = 'text-[10px] px-2 py-0.5 rounded-full bg-[#ee2726]/15 text-[#ff6b6b] border border-[#ee2726]/30 font-semibold'; }
      if (descEl) descEl.textContent = 'ห้องพูดคุยทีมสื่อ วิดีโอ และคอนเทนต์';
    } else if (channelId.startsWith('dm_')) {
      const parts = channelId.replace('dm_', '').split('_');
      const otherUserId = parts.find(id => id !== this.currentUser?.id) || parts[0];
      const otherUser = this.users.find(u => u.id === otherUserId) || { name: 'เพื่อนร่วมงาน', avatar: '', department: '' };

      if (iconEl) iconEl.innerHTML = `<img src="${otherUser.avatar}" class="w-8 h-8 rounded-xl object-cover">`;
      if (titleEl) titleEl.textContent = `${otherUser.name}`;
      if (badgeEl) { badgeEl.textContent = `แชทส่วนตัว (${otherUser.department})`; badgeEl.className = 'text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold'; }
      if (descEl) descEl.textContent = `การสนทนาส่วนตัว 1-on-1 ระหว่างคุณกับ ${otherUser.name}`;
    }

    await this.loadChatMessages(channelId);
  }

  async loadChatMessages(channelId) {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    container.innerHTML = `
      <div class="h-full flex items-center justify-center text-zinc-500 text-xs">
        <span class="animate-pulse">กำลังโหลดข้อความ...</span>
      </div>
    `;

    try {
      const res = await fetch(`/api/chat/messages?channelId=${encodeURIComponent(channelId)}`, {
        headers: this.getAuthHeaders()
      });
      const messages = await res.json();
      this.chatMessages = Array.isArray(messages) ? messages : [];
      this.renderChatMessages();
      this.scrollChatToBottom();
    } catch (err) {
      console.error(err);
      container.innerHTML = `<p class="text-xs text-rose-400 text-center py-6">ไม่สามารถโหลดข้อความได้: ${err.message}</p>`;
    }
  }

  renderChatMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    if (this.chatMessages.length === 0) {
      container.innerHTML = `
        <div class="h-64 flex flex-col items-center justify-center text-zinc-500 text-xs space-y-2">
          <div class="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-xl text-zinc-400">💬</div>
          <p class="font-semibold text-zinc-400">ยังไม่มีข้อความในห้องนี้</p>
          <p class="text-[11px] text-zinc-600">เป็นคนแรกที่เริ่มบทสนทนาได้เลยครับ!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.chatMessages.map(msg => this.createChatMessageHTML(msg)).join('');
    this.safeIcons();
  }

  createChatMessageHTML(msg) {
    const isMe = this.currentUser && msg.senderId === this.currentUser.id;
    const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '';
    const isManager = msg.senderRole === 'manager';

    if (isMe) {
      return `
        <div class="flex items-end justify-end space-x-2 my-2">
          <div class="flex flex-col items-end max-w-sm sm:max-w-md">
            <div class="bg-gradient-to-r from-[#d91b1a] to-[#ee2726] text-white p-3.5 rounded-3xl rounded-br-xs shadow-lg text-xs leading-relaxed break-words space-y-1">
              <p class="whitespace-pre-line">${msg.content}</p>
              ${msg.attachmentUrl ? `
                <div class="pt-1.5 border-t border-white/20">
                  <a href="${msg.attachmentUrl}" target="_blank" class="text-white underline font-bold flex items-center space-x-1 text-[11px]">
                    <i data-lucide="paperclip" class="w-3 h-3"></i>
                    <span class="truncate max-w-[200px]">${msg.attachmentUrl}</span>
                  </a>
                </div>
              ` : ''}
            </div>
            <span class="text-[10px] text-zinc-500 mt-1 mr-1">${timeStr}</span>
          </div>
          <img src="${msg.senderAvatar || this.currentUser.avatar}" class="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700 object-cover flex-shrink-0 mb-4">
        </div>
      `;
    } else {
      return `
        <div class="flex items-start space-x-2.5 my-2">
          <img src="${msg.senderAvatar}" class="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 object-cover flex-shrink-0 mt-0.5">
          <div class="flex flex-col items-start max-w-sm sm:max-w-md">
            <div class="flex items-center space-x-1.5 mb-1 ml-1">
              <span class="text-xs font-bold text-zinc-200">${msg.senderName}</span>
              ${isManager ? `<span class="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">👑 หัวหน้างาน</span>` : `<span class="text-[10px] text-zinc-500">(${msg.senderDept || ''})</span>`}
            </div>
            <div class="bg-zinc-900 border border-zinc-800 text-zinc-100 p-3.5 rounded-3xl rounded-tl-xs shadow-md text-xs leading-relaxed break-words space-y-1">
              <p class="whitespace-pre-line">${msg.content}</p>
              ${msg.attachmentUrl ? `
                <div class="pt-1.5 border-t border-zinc-800">
                  <a href="${msg.attachmentUrl}" target="_blank" class="text-sky-400 hover:underline font-bold flex items-center space-x-1 text-[11px]">
                    <i data-lucide="paperclip" class="w-3 h-3 text-sky-400"></i>
                    <span class="truncate max-w-[200px]">${msg.attachmentUrl}</span>
                  </a>
                </div>
              ` : ''}
            </div>
            <span class="text-[10px] text-zinc-500 mt-1 ml-1">${timeStr}</span>
          </div>
        </div>
      `;
    }
  }

  appendChatMessageHTML(msg) {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    if (container.querySelector('.h-64')) {
      container.innerHTML = '';
    }

    const html = this.createChatMessageHTML(msg);
    container.insertAdjacentHTML('beforeend', html);
    this.safeIcons();
  }

  async handleSendChatMessage(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('chat-message-input');
    const attachInput = document.getElementById('chat-attachment-url');
    if (!input) return;

    const content = input.value.trim();
    const attachmentUrl = attachInput ? attachInput.value.trim() : '';

    if (!content && !attachmentUrl) return;

    try {
      input.value = '';
      if (attachInput) attachInput.value = '';
      const attachBar = document.getElementById('chat-attachment-bar');
      if (attachBar) attachBar.classList.add('hidden');

      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          channelId: this.activeChatChannel,
          content,
          attachmentUrl
        })
      });

      const newMsg = await res.json();
      if (!res.ok) throw new Error(newMsg.error || 'ส่งข้อความไม่สำเร็จ');

      input.focus();
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
    }
  }

  handleChatKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSendChatMessage();
    }
  }

  insertChatEmoji(emoji) {
    const input = document.getElementById('chat-message-input');
    if (!input) return;
    input.value = `${input.value}${emoji} `;
    input.focus();
  }

  toggleChatAttachment() {
    const bar = document.getElementById('chat-attachment-bar');
    if (!bar) return;
    bar.classList.toggle('hidden');
    if (!bar.classList.contains('hidden')) {
      document.getElementById('chat-attachment-url')?.focus();
    }
  }

  scrollChatToBottom() {
    const container = document.getElementById('chat-messages-container');
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  }

  updateChatUnreadBadges() {
    const topBadge = document.getElementById('chat-unread-badge');
    const floatBadge = document.getElementById('floating-chat-unread-badge');
    const mobBadge = document.getElementById('mob-chat-unread-badge');

    if (this.unreadChatCount > 0) {
      if (topBadge) { topBadge.textContent = this.unreadChatCount; topBadge.classList.remove('hidden'); }
      if (floatBadge) { floatBadge.textContent = this.unreadChatCount; floatBadge.classList.remove('hidden'); }
      if (mobBadge) { mobBadge.classList.remove('hidden'); }
    } else {
      if (topBadge) topBadge.classList.add('hidden');
      if (floatBadge) floatBadge.classList.add('hidden');
      if (mobBadge) mobBadge.classList.add('hidden');
    }
  }

  exportToCSV() {
    const filtered = this.getFilteredTasks();
    if (filtered.length === 0) {
      this.showToast('ไม่มีข้อมูลงานที่จะ Export', 'info');
      return;
    }

    const headers = ['Task Code', 'Business Unit', 'Title', 'Departments', 'Assignee', 'Priority', 'Status', 'Deadline', 'Revision Count'];
    const rows = filtered.map(t => {
      const assignee = this.users.find(u => u.id === t.assignedTo)?.name || '';
      return [
        `"${t.code || ''}"`,
        `"${t.bu || ''}"`,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${t.department || ''}"`,
        `"${assignee}"`,
        `"${t.priority || ''}"`,
        `"${t.status || ''}"`,
        `"${new Date(t.deadline).toLocaleDateString('th-TH')}"`,
        `"${t.revisionCount || 0}"`
      ].join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TVmunk_Task_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('ดาวน์โหลดรายงาน CSV สำเร็จ 📊', 'success');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    let bg = 'bg-zinc-900 border-zinc-700 text-zinc-100';
    let icon = 'info';
    if (type === 'success') {
      bg = 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100';
      icon = 'check-circle';
    } else if (type === 'error') {
      bg = 'bg-rose-950/90 border-[#ee2726]/60 text-rose-100';
      icon = 'alert-triangle';
    }

    const toast = document.createElement('div');
    toast.className = `toast-anim flex items-center space-x-2.5 px-4 py-3 rounded-2xl border shadow-2xl text-xs font-medium backdrop-blur-md ${bg} pointer-events-auto`;
    toast.innerHTML = `
      <i data-lucide="${icon}" class="w-4 h-4 flex-shrink-0 text-[#ee2726]"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    this.safeIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

window.app = new TaskHubApp();
