const API_BASE = 'http://localhost:5000/api';

let token = null;
let currentUser = null;

const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const authForm = document.getElementById('authForm');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const authMessage = document.getElementById('authMessage');
const logoutBtn = document.getElementById('logoutBtn');
const userRoleDiv = document.getElementById('userRole');
const displayUsername = document.getElementById('displayUsername');
const displayRole = document.getElementById('displayRole');

const messageForm = document.getElementById('messageForm');
const recipientUsernameInput = document.getElementById('recipientUsername');
const messageTextInput = document.getElementById('messageText');
const messageStatus = document.getElementById('messageStatus');
const messagesList = document.getElementById('messagesList');

const fileForm = document.getElementById('fileForm');
const fileInput = document.getElementById('fileInput');
const fileStatus = document.getElementById('fileStatus');
const filesList = document.getElementById('filesList');

function setAuthToken(t) {
  token = t;
  if (token) {
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}

function showAuthSection() {
  authSection.classList.remove('hidden');
  appSection.classList.add('hidden');
  logoutBtn.classList.add('hidden');
  userRoleDiv.classList.add('hidden');
  authMessage.textContent = '';
}

function showAppSection() {
  authSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
  userRoleDiv.classList.remove('hidden');
  displayUsername.textContent = currentUser.username;
  displayRole.textContent = currentUser.role;
}

async function login(username, password) {
  try {
    const response = await axios.post(\`\${API_BASE}/auth/login\`, { username, password });
    setAuthToken(response.data.token);
    currentUser = { username, role: response.data.role };
    showAppSection();
    await loadMessages();
    await loadFiles();
  } catch (err) {
    authMessage.textContent = err.response?.data?.message || 'Login failed';
  }
}

async function register(username, password, role) {
  try {
    await axios.post(\`\${API_BASE}/auth/register\`, { username, password, role });
    authMessage.textContent = 'Registration successful. You can now login.';
  } catch (err) {
    authMessage.textContent = err.response?.data?.message || 'Registration failed';
  }
}

authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  login(username, password);
});

registerBtn.addEventListener('click', () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const role = document.getElementById('role').value;
  if (!role) {
    authMessage.textContent = 'Please select a role to register.';
    return;
  }
  register(username, password, role);
});

logoutBtn.addEventListener('click', () => {
  setAuthToken(null);
  currentUser = null;
  showAuthSection();
  messagesList.innerHTML = '';
  filesList.innerHTML = '';
  messageStatus.textContent = '';
  fileStatus.textContent = '';
});

function encryptMessage(message, key) {
  return CryptoJS.AES.encrypt(message, key).toString();
}

function decryptMessage(ciphertext, key) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '[Decryption error]';
  }
}

async function loadMessages() {
  try {
    const response = await axios.get(\`\${API_BASE}/messages\`);
    messagesList.innerHTML = '';
    for (const msg of response.data) {
      // Decrypt message with current user's username as key (simple demo)
      const key = currentUser.username;
      const decrypted = decryptMessage(msg.encryptedContent, key);
      const sender = msg.sender.username;
      const recipient = msg.recipient.username;
      const time = new Date(msg.createdAt).toLocaleString();
      const li = document.createElement('li');
      li.className = 'p-2 bg-white rounded shadow';
      li.textContent = \`From: \${sender} To: \${recipient} - \${decrypted} (\${time})\`;
      messagesList.appendChild(li);
    }
  } catch (err) {
    console.error('Load messages error:', err);
  }
}

messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const recipientUsername = recipientUsernameInput.value.trim();
  const messageText = messageTextInput.value.trim();
  if (!recipientUsername || !messageText) {
    messageStatus.textContent = 'Recipient and message are required.';
    return;
  }
  try {
    // Encrypt message with sender's username as key (simple demo)
    const encryptedContent = encryptMessage(messageText, currentUser.username);
    // Need to get recipient user id by username
    // Since no API to get user by username, we will send recipient username directly (backend needs update)
    // For now, we will send recipientUsername as recipientId (to be fixed in backend)
    await axios.post(\`\${API_BASE}/messages\`, { recipientId: recipientUsername, encryptedContent });
    messageStatus.textContent = 'Message sent successfully.';
    messageTextInput.value = '';
    await loadMessages();
  } catch (err) {
    messageStatus.textContent = err.response?.data?.message || 'Failed to send message.';
  }
});

fileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (fileInput.files.length === 0) {
    fileStatus.textContent = 'Please select a file.';
    return;
  }
  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await axios.post(\`\${API_BASE}/files/upload\`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    fileStatus.textContent = 'File uploaded successfully.';
    loadFiles();
  } catch (err) {
    fileStatus.textContent = err.response?.data?.message || 'File upload failed.';
  }
});

async function loadFiles() {
  // For demo, we do not have a file list API, so this is a placeholder
  filesList.innerHTML = '<li>No file listing implemented yet.</li>';
}

// On page load, show auth section
showAuthSection();
