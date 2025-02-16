// 在文件开头添加用户验证
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

// 数据库操作类
class NotesDB {
    constructor() {
        this.apiUrl = 'http://localhost:8080/api.php'; // 修改为你的 API 地址
    }

    async saveNote(note) {
        try {
            const response = await fetch(`${this.apiUrl}?action=saveNote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(note)
            });
            
            if (!response.ok) {
                throw new Error('保存失败');
            }
            
            const result = await response.json();
            console.log('笔记保存成功');
            return result;
        } catch (error) {
            console.error('保存笔记时发生异常:', error);
            throw error;
        }
    }

    async getAllNotes(userId) {
        try {
            const response = await fetch(`${this.apiUrl}?action=getAllNotes&user_id=${userId}`);
            if (!response.ok) {
                throw new Error('获取笔记列表失败');
            }
            return await response.json();
        } catch (error) {
            console.error('获取笔记列表时发生异常:', error);
            throw error;
        }
    }

    async getNote(id, userId) {
        try {
            const response = await fetch(`${this.apiUrl}?action=getNote&id=${id}&user_id=${userId}`);
            if (!response.ok) {
                throw new Error('获取笔记详情失败');
            }
            return await response.json();
        } catch (error) {
            console.error('获取笔记详情时发生异常:', error);
            throw error;
        }
    }

    async updateNote(note) {
        try {
            const response = await fetch(`${this.apiUrl}?action=updateNote`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(note)
            });
            
            if (!response.ok) {
                throw new Error('更新失败');
            }
            
            const result = await response.json();
            console.log('笔记更新成功');
            return result;
        } catch (error) {
            console.error('更新笔记时发生异常:', error);
            throw error;
        }
    }

    async deleteNote(id, userId) {
        try {
            const response = await fetch(`${this.apiUrl}?action=deleteNote&id=${id}&user_id=${userId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('删除失败');
            }
            
            const result = await response.json();
            console.log('笔记删除成功');
            return result;
        } catch (error) {
            console.error('删除笔记时发生异常:', error);
            throw error;
        }
    }
}

// 创建数据库实例和全局变量
const db = new NotesDB();
let currentNoteId = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    const user = checkAuth();
    if (!user) return;
    
    // 显示用户信息
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.innerHTML = `<i class="ri-user-line"></i> ${user.username}`;
    }
    
    console.log('页面加载完成');
    try {
        // 加载笔记列表
        await loadNotes();
        console.log('笔记列表加载完成');
        
        // 绑定事件
        const newNoteBtn = document.getElementById('newNoteBtn');
        const saveNoteBtn = document.getElementById('saveNoteBtn');
        
        if (newNoteBtn) {
            newNoteBtn.addEventListener('click', () => {
                console.log('点击新建笔记按钮');
                clearEditor();
            });
        } else {
            console.error('找不到新建笔记按钮');
        }
        
        if (saveNoteBtn) {
            saveNoteBtn.addEventListener('click', async () => {
                console.log('点击保存笔记按钮');
                await saveNote();
            });
        } else {
            console.error('找不到保存笔记按钮');
        }

        // 添加退出登录按钮事件
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            });
        }
    } catch (error) {
        console.error('初始化失败:', error);
        alert('初始化失败: ' + error.message);
    }
});

// 清空编辑器
function clearEditor() {
    currentNoteId = null;
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteContent');
    
    if (titleInput && contentInput) {
        titleInput.value = '';
        contentInput.value = '';
        titleInput.focus();
        
        // 移除所有笔记项的活动状态
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('active');
        });
    } else {
        console.error('找不到编辑器输入框');
    }
}

// 添加提示框函数
function showToast(type, title, message) {
    const container = document.querySelector('.toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'ri-check-line' : 'ri-error-warning-line';
    
    toast.innerHTML = `
        <i class="toast-icon ${icon}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    container.appendChild(toast);
    
    // 3秒后自动消失
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            container.removeChild(toast);
            if (container.children.length === 0) {
                document.body.removeChild(container);
            }
        }, 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// 修改保存笔记函数中的提示
async function saveNote() {
    const user = checkAuth();
    if (!user) return;
    
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteContent');
    
    if (!titleInput || !contentInput) {
        console.error('找不到编辑器输入框');
        return;
    }
    
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!title) {
        showToast('error', '保存失败', '请输入笔记标题');
        titleInput.focus();
        return;
    }
    
    try {
        console.log('开始保存笔记:', { title, content });
        
        if (currentNoteId) {
            await db.updateNote({
                id: currentNoteId,
                title,
                content,
                user_id: user.id
            });
            console.log('笔记更新成功');
            showToast('success', '更新成功', '笔记已保存');
        } else {
            await db.saveNote({
                title,
                content,
                user_id: user.id
            });
            console.log('笔记保存成功');
            showToast('success', '保存成功', '新笔记已创建');
        }
        
        await loadNotes();
    } catch (error) {
        console.error('保存笔记失败:', error);
        showToast('error', '保存失败', error.message);
    }
}

// 加载笔记列表
async function loadNotes() {
    const user = checkAuth();
    if (!user) return;

    try {
        console.log('开始加载笔记列表');
        const notes = await db.getAllNotes(user.id);
        console.log('获取到笔记列表:', notes);
        
        const notesList = document.getElementById('notesList');
        if (!notesList) {
            console.error('找不到笔记列表容器');
            return;
        }
        
        notesList.innerHTML = notes.map(note => {
            // 格式化日期时间
            const createdAt = new Date(note.created_at);
            const formattedDate = createdAt.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div class="note-item ${note.id === currentNoteId ? 'active' : ''}" 
                     data-id="${note.id}">
                    <div class="note-content" onclick="selectNote(${note.id})">
                        <h3>${note.title}</h3>
                        <small>${formattedDate}</small>
                    </div>
                    <button class="delete-btn" onclick="deleteNote(${note.id})">×</button>
                </div>
            `;
        }).join('');

        // 如果有笔记且没有选中的笔记，默认选中第一个
        if (notes.length > 0 && !currentNoteId) {
            selectNote(notes[0].id);
        }
    } catch (error) {
        console.error('加载笔记列表失败:', error);
    }
}

// 选择笔记
async function selectNote(id) {
    const user = checkAuth();
    if (!user) return;

    try {
        console.log('选择笔记:', id);
        const note = await db.getNote(id, user.id);  // 传递用户ID
        console.log('获取到笔记详情:', note);
        
        if (!note) {
            console.error('笔记不存在或无权访问');
            return;
        }
        
        const titleInput = document.getElementById('noteTitle');
        const contentInput = document.getElementById('noteContent');
        
        if (!titleInput || !contentInput) {
            console.error('找不到编辑器输入框');
            return;
        }
        
        currentNoteId = id;
        titleInput.value = note.title;
        contentInput.value = note.content;

        // 更新活动状态
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.id == id) {
                item.classList.add('active');
            }
        });
    } catch (error) {
        console.error('加载笔记详情失败:', error);
    }
}

// 添加确认对话框函数
function showConfirmDialog(title, message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog';
        
        dialog.innerHTML = `
            <div class="dialog-header">
                <i class="ri-error-warning-line dialog-icon"></i>
                <div class="dialog-title">${title}</div>
            </div>
            <div class="dialog-content">${message}</div>
            <div class="dialog-actions">
                <button class="dialog-button cancel">取消</button>
                <button class="dialog-button confirm">确认删除</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // 绑定按钮事件
        const cancelBtn = dialog.querySelector('.cancel');
        const confirmBtn = dialog.querySelector('.confirm');
        
        function closeDialog(result) {
            overlay.style.animation = 'fadeOut 0.2s ease-out forwards';
            dialog.style.animation = 'scaleOut 0.2s ease-out forwards';
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve(result);
            }, 200);
        }
        
        cancelBtn.addEventListener('click', () => closeDialog(false));
        confirmBtn.addEventListener('click', () => closeDialog(true));
    });
}

// 修改删除笔记函数
async function deleteNote(id) {
    const user = checkAuth();
    if (!user) return;

    const confirmed = await showConfirmDialog(
        '删除笔记',
        '确定要删除这个笔记吗？此操作不可恢复。'
    );
    
    if (!confirmed) return;
    
    try {
        await db.deleteNote(id, user.id);
        console.log('笔记删除成功');
        
        if (id === currentNoteId) {
            clearEditor();
        }
        
        showToast('success', '删除成功', '笔记已删除');
        await loadNotes();
    } catch (error) {
        console.error('删除笔记失败:', error);
        showToast('error', '删除失败', error.message);
    }
}