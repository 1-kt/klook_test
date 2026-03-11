document.getElementById('runBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(tab.id, { action: 'execute' }, (response) => {
    status.textContent = response?.message || '执行完成';
    status.style.color = response?.error ? 'red' : 'green';
  });
});
