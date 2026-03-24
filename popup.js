// 月份映射：数字月份 → 缩写
const monthMap = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
};

// 转换日期格式：2026-04-05 → Apr 5
function convertDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const month = monthMap[parts[1]] || parts[1];
    const day = parseInt(parts[2], 10);
    return `${month} ${day}`;
  }
  return dateStr;
}

document.getElementById('runBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const jsonInput = document.getElementById('jsonInput').value;

  try {
    const input = JSON.parse(jsonInput || '{}');
    console.log('输入的原始数据:', input);

    // 字段映射和转换
    const params = {
      // 日期转换：travel_date (2026-04-05) → date (Apr 5)
      date: convertDate(input.travel_date) || input.date || '',

      // 时间：time_slot → time
      time: input.time_slot || input.time || '10:00',

      // 人数：pax 或 pax_detail.Adult → adults
      adults: input.pax || input.pax_detail?.Adult || input.adults || 1,

      // 参与者信息：暂时用空数组，后续可以从订单中提取或手动添加
      travellers: input.travellers || [],

      // 联系信息：字段映射
      contact: {
        firstName: input.contact_first_name || input.contact?.firstName || '',
        lastName: input.contact_last_name || input.contact?.lastName || '',
        phone: input.contact_mobile || input.contact_phone || input.contact?.phone || '',
        email: input.contact_email || input.contact?.email || ''
      }
    };

    console.log('转换后的参数:', params);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 检查是否是特殊页面（不支持 content script）
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
      status.textContent = '错误: 此页面不支持自动化';
      status.style.color = 'red';
      return;
    }

    console.log('发送消息到tab:', tab.id, '参数:', params);

    // 先尝试发送消息，如果失败则注入 content script
    chrome.tabs.sendMessage(tab.id, { action: 'execute', params: params }, (response) => {
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
              chrome.tabs.sendMessage(tab.id, { action: 'execute', params: params }, (resp) => {
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
