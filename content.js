// ==================== Content Script 入口 ====================
console.log('🟢 Content script 已加载 - URL:', location.href);

// ==================== 检查待执行任务 ====================
chrome.storage.local.get(['klook_task'], (result) => {
  const task = result.klook_task;
  if (task && task.currentStep === 7) {
    console.log('🎉 跳转成功，开启后续步骤');
    console.log('📋 任务参数:', task.params);
    console.log('📌 当前步骤:', task.currentStep);
    chrome.storage.local.remove(['klook_task']);

    // 执行步骤7及后续操作
    executeStep7(task.params);
  }
});

// ==================== 步骤7：选择参与者及后续操作 ====================
function executeStep7(params) {
  const { adults = 3, travellers = [] } = params;
  console.log('步骤7 - 开始选择参与者，数量:', adults);
  console.log('步骤7 - 参与者信息:', travellers);
  console.log('步骤7 - travellers数组长度:', travellers.length);

  // 等待页面加载完成
  setTimeout(() => {
    const travellerItems = document.querySelectorAll('.traveller-selector-item');
    console.log('步骤7 - 找到的参与者选项数量:', travellerItems.length);

    if (travellerItems.length === 0) {
      console.error('步骤7 - 未找到参与者选项');
      return;
    }

    // 按顺序点击前 adults 个参与者
    let clickCount = 0;
    const clickInterval = setInterval(() => {
      if (clickCount >= adults || clickCount >= travellerItems.length) {
        clearInterval(clickInterval);
        console.log('步骤7 - 参与者选择完成，共点击:', clickCount, '人');

        // 等待后开始编辑参与者信息
        console.log('步骤7 - 即将调用 editTravellers，参数:', params);
        setTimeout(() => {
          console.log('步骤7 - ===== 开始调用 editTravellers =====');
          editTravellers(params);
        }, 1500);
        return;
      }

      travellerItems[clickCount].click();
      console.log(`步骤7 - 已点击第 ${clickCount + 1} 个参与者:`, travellerItems[clickCount].textContent.trim());
      clickCount++;
    }, 500);
  }, 2000);
}

// ==================== 步骤7a：编辑参与者信息 ====================
function editTravellers(params) {
  const { travellers = [], adults = 3, contact = {} } = params;

  console.log('步骤7a - ===== 进入 editTravellers 函数 =====');
  console.log('步骤7a - params:', params);
  console.log('步骤7a - travellers:', travellers);
  console.log('步骤7a - adults:', adults);
  console.log('步骤7a - travellers.length:', travellers ? travellers.length : 'undefined');

  // 如果没有 travellers 数据或为空，直接跳到编辑联系信息
  if (!travellers || travellers.length === 0) {
    console.log('步骤7a - 没有参与者数据，跳过编辑，直接执行步骤7b（编辑联系信息）');
    // 等待一下确保没有弹窗干扰
    setTimeout(() => editContact(contact), 500);
    return;
  }

  console.log('步骤7a - 开始编辑参与者信息');

  let editIndex = 0;

  const editNext = () => {
    console.log(`步骤7a - editNext: editIndex=${editIndex}, adults=${adults}, travellers.length=${travellers.length}`);

    if (editIndex >= adults || editIndex >= travellers.length) {
      console.log('步骤7a - 所有参与者编辑完成');
      // 等待弹窗完全关闭后再编辑联系信息
      setTimeout(() => {
        // 检查弹窗是否已关闭
        const drawer = document.querySelector('.edit-drawer.klk-drawer-right');
        const title = drawer ? drawer.querySelector('h3')?.textContent.trim() : '';
        console.log('步骤7a - 检查弹窗状态: display=' + (drawer ? drawer.style.display : 'N/A') + ', title=' + title);

        if (drawer && drawer.style.display !== 'none') {
          console.log('步骤7a - 弹窗还未关闭，继续等待...');
          setTimeout(() => editContact(contact), 2000);
        } else {
          console.log('步骤7a - ✓ 弹窗已关闭，开始编辑联系信息');
          setTimeout(() => editContact(contact), 500);
        }
      }, 2000);
      return;
    }

    const traveller = travellers[editIndex];
    console.log(`步骤7a - ========== 准备编辑第 ${editIndex + 1} 个参与者 ==========`);
    console.log('步骤7a - 目标姓名:', traveller.firstName, traveller.lastName);

    // 找到所有编辑按钮
    const editBtns = document.querySelectorAll('.traveller-panel-edit');
    console.log(`步骤7a - 找到的编辑按钮数量: ${editBtns.length}，当前需要编辑第 ${editIndex + 1} 个`);

    if (editIndex >= editBtns.length) {
      console.error('步骤7a - 编辑按钮数量不足');
      editIndex++;
      setTimeout(editNext, 500);
      return;
    }

    // 点击对应的编辑按钮
    const editBtn = editBtns[editIndex];
    console.log('步骤7a - 准备点击编辑按钮...');
    editBtn.click();
    console.log(`步骤7a - ✓ 已点击第 ${editIndex + 1} 个编辑按钮`);

    // 等待编辑弹窗出现，轮询检查
    let waitCount = 0;
    const checkDrawer = () => {
      waitCount++;
      const drawer = document.querySelector('.edit-drawer.klk-drawer-right');

      // 检查弹窗是否存在且显示
      const isDrawerVisible = drawer && drawer.style.display !== 'none';

      console.log(`步骤7a - 弹窗检查 ${waitCount}: 存在=${!!drawer}, 可见=${isDrawerVisible}`);

      if (!isDrawerVisible && waitCount < 20) {
        // 继续等待，每500ms检查一次
        setTimeout(checkDrawer, 500);
        return;
      }

      if (!isDrawerVisible) {
        console.error('步骤7a - 编辑弹窗未出现，等待超时');
        editIndex++;
        setTimeout(editNext, 500);
        return;
      }

      console.log('步骤7a - ✓ 弹窗已显示，开始查找输入框');

      // 查找输入框并填写
      const inputs = document.querySelectorAll('.edit-drawer-content input[type="text"]');
      console.log('步骤7a - 找到的输入框数量:', inputs.length);

      if (inputs.length < 2) {
        console.error('步骤7a - 输入框数量不足，需要2个，实际找到', inputs.length);
        // 点击取消按钮关闭弹窗
        const cancelBtn = document.querySelector('.edit-drawer-footer .klk-button-outlined');
        if (cancelBtn) cancelBtn.click();

        setTimeout(() => {
          editIndex++;
          editNext();
        }, 1000);
        return;
      }

      // 填写第一个输入框（First Name）
      inputs[0].focus();
      inputs[0].select(); // 全选现有内容
      document.execCommand('insertText', false, traveller.firstName || '');
      inputs[0].blur();
      console.log('步骤7a - ✓ 已填写First Name:', inputs[0].value);

      // 填写第二个输入框（Last Name）
      inputs[1].focus();
      inputs[1].select(); // 全选现有内容
      document.execCommand('insertText', false, traveller.lastName || '');
      inputs[1].blur();
      console.log('步骤7a - ✓ 已填写Last Name:', inputs[1].value);

      // 等待后点击保存按钮
      setTimeout(() => {
        const saveBtn = document.querySelector('.edit-drawer-footer .klk-button-primary');
        if (saveBtn) {
          saveBtn.click();
          console.log(`步骤7a - ✓ 已点击第 ${editIndex + 1} 个保存按钮`);
        } else {
          console.error('步骤7a - 未找到保存按钮');
        }

        // 等待弹窗关闭后再继续下一个
        setTimeout(() => {
          editIndex++;
          editNext();
        }, 2000);
      }, 1000);
    };

    // 开始检查弹窗
    setTimeout(checkDrawer, 500);
  };

  console.log('步骤7a - 开始执行 editNext()');
  editNext();
}

// ==================== 步骤8：勾选协议 ====================
function executeStep8() {
  console.log('步骤8 - 开始勾选协议');

  // 尝试多种方式定位复选框
  const checkboxSpan = document.querySelector('.dynamic-form-checkbox .klk-checkbox');
  const checkboxInput = document.querySelector('.dynamic-form-checkbox input[type="checkbox"]');

  console.log('步骤8 - 复选框span存在:', !!checkboxSpan);
  console.log('步骤8 - 复选框input存在:', !!checkboxInput);

  // 优先点击 input 元素
  if (checkboxInput) {
    checkboxInput.click();
    console.log('步骤8 - 已点击input复选框');
  } else if (checkboxSpan) {
    checkboxSpan.click();
    console.log('步骤8 - 已点击span复选框');
  } else {
    console.error('步骤8 - 未找到协议复选框');
    return;
  }

  // 验证是否已勾选
  setTimeout(() => {
    const isChecked = document.querySelector('.dynamic-form-checkbox input[type="checkbox"]')?.checked;
    console.log('步骤8 - 复选框是否已勾选:', isChecked);

    // 改为提示人工继续，避免自动点击 Go to payment
    console.log('步骤8 - 已停止自动点击 Go to payment，请人工确认后再继续。');
  }, 500);
}

// ==================== 步骤9：点击确认按钮 ====================
function executeStep9() {
  console.log('步骤9 - 查找并点击 Go to payment 按钮');

  // 查找包含 "Go to payment" 文字的按钮
  const allButtons = document.querySelectorAll('button');
  let confirmBtn = null;

  for (const btn of allButtons) {
    const text = btn.textContent.trim();
    console.log('步骤9 - 检查按钮:', text);
    if (text.includes('Go to payment')) {
      confirmBtn = btn;
      console.log('步骤9 - 找到按钮:', text);
      break;
    }
  }

  if (confirmBtn) {
    console.log('步骤9 - 按钮文本:', confirmBtn.textContent.trim());
    confirmBtn.click();
    console.log('步骤9 - 已点击 Go to payment 按钮，流程完成！');
  } else {
    console.error('步骤9 - 未找到 Go to payment 按钮');
    console.log('步骤9 - 页面上所有按钮:', Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()));
  }
}

// ==================== 步骤7b：编辑联系信息 ====================
function editContact(contact) {
  console.log('步骤7b - ===== 开始编辑联系信息 =====');
  console.log('步骤7b - contact:', contact);

  // 如果没有 contact 数据，直接跳过
  if (!contact || Object.keys(contact).length === 0) {
    console.log('步骤7b - 没有联系信息数据，跳过编辑，直接执行步骤8');
    setTimeout(() => executeStep8(), 1000);
    return;
  }

  console.log('步骤7b - 开始查找联系信息的编辑按钮');

  // 联系信息面板使用 .other-info-traveller-panel 类
  const contactEditBtn = document.querySelector('.other-info-traveller-panel .traveller-panel-edit-text');
  console.log('步骤7b - 编辑按钮存在:', !!contactEditBtn);

  if (!contactEditBtn) {
    console.error('步骤7b - 未找到编辑按钮');
    setTimeout(() => executeStep8(), 1000);
    return;
  }

  // 点击编辑按钮
  contactEditBtn.click();
  console.log('步骤7b - ✓ 已点击联系信息编辑按钮');

  // 等待编辑弹窗出现
  let waitCount = 0;
  const checkDrawer = () => {
    waitCount++;
    // 找到所有弹窗，检查是否有可见的联系信息弹窗
    const allDrawers = document.querySelectorAll('.edit-drawer.klk-drawer-right');
    let contactDrawer = null;
    let contactTitle = '';

    console.log(`步骤7b - 弹窗检查 ${waitCount}: 共找到 ${allDrawers.length} 个弹窗`);

    for (const drawer of allDrawers) {
      const display = drawer.style.display;
      const title = drawer.querySelector('h3')?.textContent.trim() || '';
      const form = drawer.querySelector('.other-info-traveller-drawer-form');

      console.log(`步骤7b - 检查弹窗: display="${display}", title="${title}", hasContactForm=${!!form}`);

      if (display !== 'none' && form) {
        contactDrawer = drawer;
        contactTitle = title;
        break;
      }
    }

    const isDrawerVisible = !!contactDrawer;

    console.log(`步骤7b - 联系信息弹窗检查结果: 可见=${isDrawerVisible}, title="${contactTitle}"`);

    if (!isDrawerVisible && waitCount < 20) {
      setTimeout(checkDrawer, 500);
      return;
    }

    if (!isDrawerVisible) {
      console.error('步骤7b - 联系信息编辑弹窗未出现，等待超时');
      setTimeout(() => executeStep8(), 1000);
      return;
    }

    console.log('步骤7b - ✓ 联系信息弹窗已显示，标题:', contactTitle);

    // 在找到的弹窗内查找联系信息表单
    const contactForm = contactDrawer.querySelector('.other-info-traveller-drawer-form');
    console.log('步骤7b - 联系信息表单存在:', !!contactForm);

    if (!contactForm) {
      console.error('步骤7b - 未找到联系信息表单');
      setTimeout(() => executeStep8(), 1000);
      return;
    }

    console.log('步骤7b - ===== 开始填写联系信息 =====');
    console.log('步骤7b - contact数据:', contact);

    // 查找所有输入框（包括 text 和 email 类型）
    const allInputs = contactForm.querySelectorAll('input[type="text"], input[type="email"]');
    console.log('步骤7b - 找到的输入框数量:', allInputs.length);
    allInputs.forEach((input, index) => {
      console.log(`步骤7b - 输入框${index}: type="${input.type}", placeholder="${input.placeholder}", value="${input.value}"`);
    });

    // 填写 First Name
    if (contact.firstName) {
      console.log('步骤7b - 尝试填写First Name:', contact.firstName);
      if (allInputs.length > 0) {
        allInputs[0].focus();
        allInputs[0].select();
        const success = document.execCommand('insertText', false, contact.firstName);
        allInputs[0].blur();
        console.log('步骤7b - First Name填写结果:', success, '新值:', allInputs[0].value);
      }
    } else {
      console.log('步骤7b - contact.firstName为空或undefined，跳过');
    }

    // 填写 Last Name
    if (contact.lastName) {
      console.log('步骤7b - 尝试填写Last Name:', contact.lastName);
      if (allInputs.length > 1) {
        allInputs[1].focus();
        allInputs[1].select();
        const success = document.execCommand('insertText', false, contact.lastName);
        allInputs[1].blur();
        console.log('步骤7b - Last Name填写结果:', success, '新值:', allInputs[1].value);
      }
    } else {
      console.log('步骤7b - contact.lastName为空或undefined，跳过');
    }

    // 填写 Phone number（查找 .dynamic-form-mobile-input 下的输入框）
    if (contact.phone) {
      console.log('步骤7b - 尝试填写Phone:', contact.phone);
      const phoneInput = contactForm.querySelector('.dynamic-form-mobile-input input[type="text"]');
      console.log('步骤7b - Phone输入框存在:', !!phoneInput);
      if (phoneInput) {
        phoneInput.focus();
        phoneInput.select();
        const success = document.execCommand('insertText', false, contact.phone);
        phoneInput.blur();
        console.log('步骤7b - Phone填写结果:', success, '新值:', phoneInput.value);
      }
    } else {
      console.log('步骤7b - contact.phone为空或undefined，跳过');
    }

    // 填写 Email address（查找 .contact-email 下的 input 元素）
    if (contact.email) {
      console.log('步骤7b - 尝试填写Email:', contact.email);
      const emailWrapper = contactForm.querySelector('.contact-email');
      const emailInput = emailWrapper ? emailWrapper.querySelector('input') : null;
      console.log('步骤7b - Email包装元素存在:', !!emailWrapper, ', Email输入框存在:', !!emailInput);
      if (emailInput) {
        emailInput.focus();
        emailInput.select();
        const success = document.execCommand('insertText', false, contact.email);
        emailInput.blur();
        console.log('步骤7b - Email填写结果:', success, '新值:', emailInput.value);
      }
    } else {
      console.log('步骤7b - contact.email为空或undefined，跳过');
    }

    // 等待后点击保存按钮
    setTimeout(() => {
      const saveBtn = document.querySelector('.edit-drawer-footer .klk-button-primary');
      if (saveBtn) {
        saveBtn.click();
        console.log('步骤7b - ✓ 已点击保存按钮');
      } else {
        console.error('步骤7b - 未找到保存按钮');
      }

      // 等待后执行步骤8
      setTimeout(() => executeStep8(), 2000);
    }, 1000);
  };

  setTimeout(checkDrawer, 500);
}

// ==================== 消息监听器 ====================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 收到消息:', request);

  if (request.action === 'execute') {
    const params = request.params || {};
    const { date = 'Mar 12', time = '12:00', adults = 3 } = params;

    console.log('=== 开始执行自动化流程 ===');
    console.log('参数:', params);

    // 步骤1：点击Select按钮展开详情
    const selectButtons = document.querySelectorAll('.card .klk-button-primary');
    console.log('步骤1 - 找到的Select按钮数量:', selectButtons.length);

    if (selectButtons.length === 0) {
      sendResponse({ message: '未找到Select按钮', error: true });
      return true;
    }

    selectButtons[0].click();
    console.log('步骤1 - 已点击Select按钮');

    // 步骤2：等待2000ms后点击指定日期
    setTimeout(() => {
      const dateCells = document.querySelectorAll('.cell.cell-desktop');
      console.log('步骤2 - 找到的日期单元格数量:', dateCells.length);
      console.log('步骤2 - 查找日期:', date);

      const dateMatch = date.replace(/\s+/g, '');
      let dateFound = false;

      // 先在当前显示的日期中查找
      for (let i = 0; i < dateCells.length; i++) {
        const cellText = dateCells[i].textContent.trim();
        const cellTextNoSpace = cellText.replace(/\s+/g, '');
        console.log(`步骤2 - 日期${i}内容:`, cellText);

        if (cellTextNoSpace.includes(dateMatch)) {
          dateCells[i].click();
          dateFound = true;
          console.log('步骤2 - 已点击日期:', date);
          setTimeout(() => executeStep3(sendResponse, params), 3000);
          break;
        }
      }

      // 如果没找到，尝试点击"All"展开日历并切换月份查找
      if (!dateFound) {
        console.log('步骤2 - 未在默认日期中找到，尝试点击All展开日历');
        console.log('步骤2 - 所有日期单元格内容:', Array.from(dateCells).map(c => c.textContent.trim()));

        // 尝试多种方式查找日历展开按钮
        let allBtnFound = false;

        // 方法1: 在日期单元格中查找All
        for (let i = 0; i < dateCells.length; i++) {
          const cellText = dateCells[i].textContent.trim();
          if (cellText === 'All' || cellText.includes('All')) {
            dateCells[i].click();
            allBtnFound = true;
            console.log('步骤2 - 已点击All (方法1)');
            break;
          }
        }

        // 方法2: 查找包含"All"文本的任何元素
        if (!allBtnFound) {
          const allElements = document.querySelectorAll('*');
          for (const el of allElements) {
            if (el.textContent === 'All' && el.classList.contains('cell')) {
              el.click();
              allBtnFound = true;
              console.log('步骤2 - 已点击All (方法2)');
              break;
            }
          }
        }

        // 方法3: 直接点击日期输入框展开日历
        if (!allBtnFound) {
          const dateInput = document.querySelector('input[placeholder*="date"], input[placeholder*="Date"], .date-picker-input');
          if (dateInput) {
            dateInput.click();
            allBtnFound = true;
            console.log('步骤2 - 已点击日期输入框展开日历 (方法3)');
          }
        }

        if (allBtnFound) {

            // 月份映射表 - 使用缩写形式
            const monthMap = {
              'Jan': 'Jan', 'Feb': 'Feb', 'Mar': 'Mar', 'Apr': 'Apr',
              'May': 'May', 'Jun': 'Jun', 'Jul': 'Jul', 'Aug': 'Aug',
              'Sep': 'Sep', 'Oct': 'Oct', 'Nov': 'Nov', 'Dec': 'Dec'
            };

            // 解析目标月份 - 使用缩写
            let targetMonth = '';
            for (const [abbr, full] of Object.entries(monthMap)) {
              if (date.includes(abbr) || date.includes(full)) {
                targetMonth = abbr;
                break;
              }
            }
            console.log('步骤2 - 目标月份(缩写):', targetMonth);
            console.log('步骤2 - 输入日期:', date);

            setTimeout(() => {
              // 切换到目标月份并查找日期
              const switchMonthAndFindDate = (attemptCount = 0) => {
                const maxAttempts = 24; // 最多切换24个月（防止死循环）

                console.log(`步骤2 - ===== switchMonthAndFindDate 调用 (第${attemptCount + 1}次) =====`);

                // 获取当前日历显示的月份 - 修正选择器
                const calendarHeader = document.querySelector('.klk-date-picker-panel-header-title');
                const currentMonth = calendarHeader ? calendarHeader.textContent.trim() : '';
                console.log(`步骤2 - 当前日历月份: "${currentMonth}", 目标月份: "${targetMonth}"`);
                console.log(`步骤2 - 月份匹配: "${currentMonth}".includes("${targetMonth}") = ${currentMonth.includes(targetMonth)}`);

                // 检查是否已是目标月份
                if (currentMonth.includes(targetMonth)) {
                  console.log('步骤2 - ✅ 月份匹配成功！不再切换，开始查找日期');

                  // 等待日历渲染完成后再查找日期
                  setTimeout(() => {
                    const dateNum = date.match(/\d+/)?.[0] || date;
                    console.log('步骤2 - 目标日期数字:', dateNum);

                    // 尝试多种方式查找日期元素
                    let calendarDates = document.querySelectorAll('.klk-date-picker-date:not(.klk-date-picker-date-disabled) .klk-date-picker-date-inner');
                    console.log('步骤2 - 日历中的可选日期数量(方式1):', calendarDates.length);

                    // 如果方式1找不到，尝试方式2
                    if (calendarDates.length === 0) {
                      calendarDates = document.querySelectorAll('.klk-date-picker-date:not(.klk-date-picker-date-disabled)');
                      console.log('步骤2 - 日历中的可选日期数量(方式2):', calendarDates.length);
                    }

                    // 打印所有日期用于调试
                    if (calendarDates.length > 0) {
                      console.log('步骤2 - 所有可选日期:', Array.from(calendarDates).map(d => d.textContent.trim()));
                    } else {
                      console.error('步骤2 - 日历中没有可选日期！');
                      sendResponse({ message: `日历中没有可选日期`, error: true });
                      return;
                    }

                    let foundInCalendar = false;
                    for (let j = 0; j < calendarDates.length; j++) {
                      const dateText = calendarDates[j].textContent.trim();
                      console.log(`步骤2 - 检查日期${j}: "${dateText}" vs "${dateNum}"`);
                      // 精确匹配或包含匹配
                      if (dateText === dateNum || dateText.includes(dateNum) || dateNum.includes(dateText)) {
                        console.log('步骤2 - 找到匹配日期，准备点击');
                        // 尝试点击可点击的父元素
                        const clickableParent = calendarDates[j].closest('.klk-date-picker-date') || calendarDates[j];
                        clickableParent.click();
                        foundInCalendar = true;
                        console.log('步骤2 - ✅✅✅ 已点击日历中的日期:', date, '，2秒后执行步骤3');
                        setTimeout(() => {
                          console.log('步骤2 - ===== 延迟结束，调用 executeStep3 =====');
                          executeStep3(sendResponse, params);
                        }, 2000);
                        break;
                      }
                    }

                    if (!foundInCalendar) {
                      console.error('步骤2 - ❌ 在目标月份中未找到日期:', dateNum);
                      sendResponse({ message: `在${targetMonth}中未找到日期: ${dateNum}，可选日期: ${Array.from(calendarDates).map(d => d.textContent.trim()).join(', ')}`, error: true });
                    }
                  }, 500); // 等待500ms让日历完全渲染
                  return;
                }

                console.log('步骤2 - ❌ 月份不匹配，准备点击下个月按钮继续切换');

                // 如果超过最大尝试次数，报错
                if (attemptCount >= maxAttempts) {
                  console.error('步骤2 - 月份切换超过最大尝试次数:', maxAttempts);
                  sendResponse({ message: `未找到目标月份: ${targetMonth}，已尝试${maxAttempts}次切换`, error: true });
                  return;
                }

                // 点击下个月按钮 - 尝试多种查找方式
                let nextMonthBtn = document.querySelector('.klk-date-picker-next-btn');
                if (!nextMonthBtn) {
                  nextMonthBtn = document.querySelector('.i-icon-icon-next');
                }
                if (!nextMonthBtn) {
                  // 尝试查找所有可能的下月按钮
                  const allNextBtns = document.querySelectorAll('span[class*="next"]');
                  console.log('步骤2 - 尝试查找所有包含next的span:', allNextBtns.length);
                  for (const btn of allNextBtns) {
                    console.log('步骤2 - 找到next按钮:', btn.className);
                  }
                }

                console.log('步骤2 - 下个月按钮查找结果:', !!nextMonthBtn, nextMonthBtn ? nextMonthBtn.className : 'N/A');

                if (nextMonthBtn) {
                  console.log(`步骤2 - 点击下个月按钮 (第${attemptCount + 1}次切换)`);
                  nextMonthBtn.click();

                  // 等待动画完成后继续
                  setTimeout(() => {
                    console.log(`步骤2 - 800ms等待结束，准备下次调用`);
                    switchMonthAndFindDate(attemptCount + 1);
                  }, 800);
                } else {
                  console.error('步骤2 - 未找到下个月按钮');
                  // 打印日历容器信息用于调试
                  const picker = document.querySelector('.klk-date-picker');
                  console.log('步骤2 - 日历容器存在:', !!picker);
                  if (picker) {
                    console.log('步骤2 - 日历HTML:', picker.innerHTML.substring(0, 500));
                  }
                  sendResponse({ message: '未找到月份切换按钮', error: true });
                }
              };

              // 开始切换月份
              switchMonthAndFindDate();
            }, 3000);
        }

        if (!allBtnFound) {
          console.error('步骤2 - 未找到All按钮');
          sendResponse({ message: `未找到日期: ${date}，也未找到All按钮`, error: true });
        }
      }
    }, 2000);

    return true;
  }
});

console.log('✅ 消息监听器已注册');

// ==================== 步骤3及后续的执行函数 ====================
function executeStep3(sendResponse, params) {
  const { date = 'Mar 12', time = '12:00', adults = 3 } = params;
  console.log('步骤3 - 开始执行，完整params:', params);

  const timeslotTrigger = document.querySelector('.timeslot-trigger.desktop');
  console.log('步骤3 - timeslot触发器存在:', !!timeslotTrigger);

  if (!timeslotTrigger) {
    sendResponse({ message: '未找到timeslot选择器', error: true });
    return;
  }

  timeslotTrigger.click();
  console.log('步骤3 - 已点击timeslot触发器');

  // 步骤4：等待3000ms后点击指定时间选项
  setTimeout(() => {
    const options = document.querySelectorAll('.time-item');
    console.log('步骤4 - 找到的时间选项数量:', options.length);
    console.log('步骤4 - 查找时间:', time);

    const timeMatch = time.replace(/\s+/g, '');
    let timeFound = false;

    for (let i = 0; i < options.length; i++) {
      const optText = options[i].textContent.trim();
      const optTextNoSpace = optText.replace(/\s+/g, '');
      console.log(`步骤4 - 时间${i}内容:`, optText);

      if (optTextNoSpace.includes(timeMatch)) {
        options[i].click();
        timeFound = true;
        console.log('步骤4 - 已点击时间:', time);
        break;
      }
    }

    if (!timeFound) {
      console.error('步骤4 - 未找到时间:', time);
      sendResponse({ message: `未找到时间: ${time}，共找到${options.length}个时间选项`, error: true });
      return;
    }

    // 步骤5：等待2000ms后选择人数
    setTimeout(() => {
      const increaseBtn = document.querySelector('.klk-counter-increase');
      console.log('步骤5 - 数量增加按钮存在:', !!increaseBtn);

      if (!increaseBtn) {
        sendResponse({ message: '未找到数量增加按钮', error: true });
        return;
      }

      const clickCount = adults;
      console.log('步骤5 - 需要点击人数:', adults);

      const clickTimes = (count) => {
        if (count <= 0) {
          console.log('步骤5 - 人数选择完成');

          // 步骤6：等待2000ms后点击Book now按钮
          setTimeout(() => {
            const buttons = document.querySelectorAll('.booking-bottom .klk-button-primary');
            console.log('步骤6 - 找到的按钮数量:', buttons.length);

            let bookNowBtn = null;
            for (let btn of buttons) {
              const btnText = btn.textContent.trim();
              console.log('步骤6 - 按钮文本:', btnText);
              if (btnText.includes('Book now')) {
                bookNowBtn = btn;
                break;
              }
            }

            if (bookNowBtn) {
              // 保存完整的任务状态到chrome.storage（包含travellers）
              const taskData = {
                currentStep: 7,
                params: params,  // 保存完整的params，包含travellers
                completedSteps: [1, 2, 3, 4, 5, 6],
                timestamp: Date.now()
              };
              chrome.storage.local.set({ klook_task: taskData }, () => {
                console.log('💾 任务状态已保存到storage，包含travellers:', taskData);
              });

              bookNowBtn.click();
              console.log('步骤6 - 已点击Book now按钮，等待跳转...');
              sendResponse({ message: `成功: ${date} ${time} ${adults}人 → Book now，跳转后将继续执行` });
            } else {
              console.error('步骤6 - 未找到Book now按钮');
              sendResponse({ message: '未找到Book now按钮', error: true });
            }
          }, 2000);
          return;
        }

        increaseBtn.click();
        console.log('步骤5 - 点击加号，剩余:', count - 1);
        setTimeout(() => clickTimes(count - 1), 500);
      };

      clickTimes(clickCount);
    }, 2000);
  }, 3000);
}
