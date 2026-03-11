document.getElementById('runBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const jsonInput = document.getElementById('jsonInput').value;

  try {
    const params = JSON.parse(jsonInput || '{}');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { action: 'execute', params }, (response) => {
      status.textContent = response?.message || '执行完成';
      status.style.color = response?.error ? 'red' : 'green';
    });
  } catch (e) {
    status.textContent = 'JSON格式错误: ' + e.message;
    status.style.color = 'red';
  }
});
