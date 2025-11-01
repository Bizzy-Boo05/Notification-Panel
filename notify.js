// localStorage key
    const STORAGE_KEY = 'notifications_app_v1';

    // default seed data (appears on first visit)
    const defaultNotifications = [
      { id: genId(), title: 'Welcome!', text: 'This notification panel is persistent on your device. It will not change unless you change it.', type: 'info', read: false, time: Date.now() - 1000*60*60 },
      { id: genId(), title: 'Reminder', text: 'Don’t forget to check the project checklist before submission.', type: 'warning', read: false, time: Date.now() - 1000*60*30 },
      { id: genId(), title: 'Server Status', text: 'All systems running smoothly.', type: 'success', read: true, time: Date.now() - 1000*60*5 }
    ];

    // UTIL: generate short unique id
    function genId(){ return 'n_' + Math.random().toString(36).slice(2,9); }

    // read from localStorage or seed
    function loadNotifications(){
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultNotifications));
        return defaultNotifications.slice();
      }
      try { return JSON.parse(raw); } catch(e){ return defaultNotifications.slice(); }
    }

    function saveNotifications(list){
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    // render notifications
    const listEl = document.getElementById('list');
    const emptyState = document.getElementById('emptyState');
    let notifications = loadNotifications();
    render();

    // RENDER function (reads notifications array and renders cards)
    function render(){
      const q = document.getElementById('search').value.trim().toLowerCase();
      const filter = document.getElementById('filter').value;
      // sort newest first
      const visible = notifications
        .slice()
        .sort((a,b)=> b.time - a.time)
        .filter(n=>{
          if(filter==='unread' && n.read) return false;
          if(filter==='read' && !n.read) return false;
          if(!q) return true;
          return (n.title + ' ' + n.text).toLowerCase().includes(q);
        });

      listEl.innerHTML = '';
      if(visible.length === 0){
        emptyState.style.display = 'block';
        return;
      } else emptyState.style.display = 'none';

      visible.forEach(n=>{
        const wrap = document.createElement('div');
        wrap.className = 'notif-card';
        wrap.innerHTML = `
          <div class="notif-head">
            <div class="d-flex align-items-start gap-2">
              <div style="width:46px; height:46px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:700; color:#fff; background:${typeColor(n.type)};">
                ${iconFor(n.type)}
              </div>
              <div>
                <div style="font-weight:700">${escapeHtml(n.title)} ${n.read ? '' : '<span class="badge-unread ms-2">NEW</span>'}</div>
                <div class="notif-meta">${timeAgo(n.time)}</div>
              </div>
            </div>
            <div class="d-flex gap-2 align-items-start">
              <button class="btn btn-sm btn-ghost" data-action="toggle" data-id="${n.id}" title="Mark read/unread"><i class="bi bi-bookmark${n.read ? '-check' : ''}"></i></button>
              <button class="btn btn-sm btn-ghost" data-action="edit" data-id="${n.id}" title="Edit"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-ghost text-danger" data-action="delete" data-id="${n.id}" title="Delete"><i class="bi bi-trash"></i></button>
            </div>
          </div>
          <div class="mt-2 small-muted">${escapeHtml(n.text)}</div>
        `;
        listEl.appendChild(wrap);
      });
    }

    // helpers
    function typeColor(t){
      switch(t){
        case 'success': return '#3db24a';
        case 'warning': return '#f0ad4e';
        case 'danger': return '#d9534f';
        default: return '#5bc0de';
      }
    }
    function iconFor(t){
      switch(t){
        case 'success': return '<i class="bi bi-check-lg"></i>';
        case 'warning': return '<i class="bi bi-exclamation-lg"></i>';
        case 'danger': return '<i class="bi bi-x-lg"></i>';
        default: return '<i class="bi bi-info-lg"></i>';
      }
    }
    function timeAgo(ts){
      const diff = Math.floor((Date.now()-ts)/1000);
      if(diff < 60) return `${diff}s ago`;
      if(diff < 3600) return `${Math.floor(diff/60)}m ago`;
      if(diff < 86400) return `${Math.floor(diff/3600)}h ago`;
      return `${Math.floor(diff/86400)}d ago`;
    }
    function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

    // Search & filter listeners
    document.getElementById('search').addEventListener('input', render);
    document.getElementById('filter').addEventListener('change', render);

    // Add / Preview
    document.getElementById('btnPreview').addEventListener('click', ()=>{
      const t = document.getElementById('title').value.trim() || 'Preview';
      const m = document.getElementById('message').value.trim() || 'Message preview';
      const ty = document.getElementById('type').value;
      document.getElementById('previewBox').style.display = 'block';
      document.getElementById('previewTitle').textContent = t;
      const badge = document.getElementById('previewType');
      badge.textContent = ty.charAt(0).toUpperCase() + ty.slice(1);
      badge.className = 'badge rounded-pill bg-secondary';
      document.getElementById('previewMessage').textContent = m;
    });

    document.getElementById('btnAdd').addEventListener('click', ()=>{
      const title = document.getElementById('title').value.trim();
      const text  = document.getElementById('message').value.trim();
      const type  = document.getElementById('type').value;
      if(!title || !text){ alert('Please enter title and message'); return; }
      const obj = { id: genId(), title, text, type, read: false, time: Date.now() };
      notifications.push(obj);
      saveNotifications(notifications);
      render();
      // clear form
      document.getElementById('title').value = '';
      document.getElementById('message').value = '';
      document.getElementById('previewBox').style.display = 'none';
    });

    // delegated action handlers (edit/delete/toggle)
    listEl.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-action]');
      if(!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if(action === 'delete'){ if(confirm('Delete this notification?')) removeNotification(id); }
      if(action === 'toggle'){ toggleRead(id); }
      if(action === 'edit'){ openEdit(id); }
    });

    // remove
    function removeNotification(id){
      notifications = notifications.filter(n=> n.id !== id);
      saveNotifications(notifications);
      render();
    }
    // toggle read/unread
    function toggleRead(id){
      notifications = notifications.map(n=> n.id===id ? {...n, read: !n.read} : n);
      saveNotifications(notifications);
      render();
    }

    // EDIT flow using bootstrap modal
    let currentEditId = null;
    const editModalEl = document.getElementById('editModal');
    const editModal = new bootstrap.Modal(editModalEl);

    function openEdit(id){
      currentEditId = id;
      const n = notifications.find(x=>x.id===id);
      if(!n) return;
      document.getElementById('editTitle').value = n.title;
      document.getElementById('editMessage').value = n.text;
      document.getElementById('editType').value = n.type;
      editModal.show();
    }

    document.getElementById('saveEdit').addEventListener('click', ()=>{
      const title = document.getElementById('editTitle').value.trim();
      const text = document.getElementById('editMessage').value.trim();
      const type = document.getElementById('editType').value;
      if(!title || !text) { alert('Title and message required'); return; }
      notifications = notifications.map(n => n.id===currentEditId ? {...n, title, text, type, time: Date.now()} : n);
      saveNotifications(notifications);
      editModal.hide();
      render();
    });

    // Reset to defaults & Clear
    document.getElementById('btnReset').addEventListener('click', ()=>{
      if(confirm('Reset to default notifications?')) {
        notifications = defaultNotifications.slice();
        saveNotifications(notifications);
        render();
      }
    });
    document.getElementById('btnClear').addEventListener('click', ()=>{
      if(confirm('Remove all notifications?')) {
        notifications = [];
        saveNotifications(notifications);
        render();
      }
    });

    // initial load done above (notifications variable). ensure rendering
    // note: notifications variable defined earlier