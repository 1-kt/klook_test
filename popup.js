document.getElementById('runBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const jsonInput = document.getElementById('jsonInput').value;
  const travellersInput = document.getElementById('travellersInput').value;
  const contactInput = document.getElementById('contactInput').value;

  try {
    const params = JSON.parse(jsonInput || '{}');
    const travellers = JSON.parse(travellersInput || '[]');
    const contact = JSON.parse(contactInput || '{}');

    // 合并参数
    const mergedParams = { ...params, travellers, contact };

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 检查是否是特殊页面（不支持 content script）
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
      status.textContent = '错误: 此页面不支持自动化';
      status.style.color = 'red';
      return;
    }

    console.log('发送消息到tab:', tab.id, '参数:', mergedParams);

    // 先尝试发送消息，如果失败则注入 content script
    chrome.tabs.sendMessage(tab.id, { action: 'execute', params: mergedParams }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script 未加载，尝试注入
        console.log('Content script 未加载，尝试注入...');
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('注入失败:', chrome.runtime.lastError.message);
            status.textContent = '错误: 无法在此页面运行脚本';
            status.style.color = 'red';
          } else {
            // 注入成功，重新发送消息
            console.log('注入成功，重新发送消息...');
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, { action: 'execute', params: mergedParams }, (resp) => {
                if (chrome.runtime.lastError) {
                  console.error('消息发送失败:', chrome.runtime.lastError.message);
                  status.textContent = '错误: ' + chrome.runtime.lastError.message;
                  status.style.color = 'red';
                } else {
                  console.log('收到响应:', resp);
                  status.textContent = resp?.message || '执行完成';
                  status.style.color = resp?.error ? 'red' : 'green';
                }
              });
            }, 100);
          }
        });
        return;
      }
      console.log('收到响应:', response);
      status.textContent = response?.message || '执行完成';
      status.style.color = response?.error ? 'red' : 'green';
    });
  } catch (e) {
    console.error('执行错误:', e);
    status.textContent = 'JSON格式错误: ' + e.message;
    status.style.color = 'red';
  }
});
