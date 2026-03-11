// 自动化流程：点击Select → 选择日期 → 选择timeslot
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'execute') {
    try {
      // 步骤1：点击Select按钮展开详情
      const selectButtons = document.querySelectorAll('.card .klk-button-primary');

      if (selectButtons.length > 0) {
        selectButtons[0].click();

        // 步骤2：等待500ms后点击Mar 12日期
        setTimeout(() => {
          const dateCells = document.querySelectorAll('.cell.cell-desktop');
          if (dateCells.length > 0) {
            dateCells[0].click();

            // 步骤3：等待1500ms后点击timeslot下拉框
            setTimeout(() => {
              const timeslotTrigger = document.querySelector('.timeslot-trigger.desktop');
              if (timeslotTrigger) {
                timeslotTrigger.click();

                // 步骤4：等待2000ms后点击12:00选项（等下拉框完全展开）
                setTimeout(() => {
                  // 查找包含12:00文本的时间选项
                  const options = document.querySelectorAll('.time-item');
                  console.log('找到的时间选项数量:', options.length);
                  let found = false;
                  for (let opt of options) {
                    console.log('选项文本:', opt.textContent.trim());
                    if (opt.textContent.includes('12:00')) {
                      opt.click();
                      found = true;
                      break;
                    }
                  }

                  if (found) {
                    // 步骤5：等待1000ms后选择人数到3人（点击加号3次）
                    setTimeout(() => {
                      const increaseBtn = document.querySelector('.klk-counter-increase');
                      if (increaseBtn) {
                        // 点击第1次：0→1 或 1→2
                        increaseBtn.click();
                        // 等待300ms后点击第2次
                        setTimeout(() => {
                          increaseBtn.click();
                          // 等待300ms后点击第3次
                          setTimeout(() => {
                            increaseBtn.click();
                            // 步骤6：等待1000ms后点击Book now按钮
                            setTimeout(() => {
                              // 查找包含"Book now"文本的按钮
                              const buttons = document.querySelectorAll('.booking-bottom .klk-button-primary');
                              let bookNowBtn = null;
                              for (let btn of buttons) {
                                if (btn.textContent.includes('Book now')) {
                                  bookNowBtn = btn;
                                  break;
                                }
                              }
                              if (bookNowBtn) {
                                bookNowBtn.click();
                                sendResponse({ message: '点击Select → 选择Mar 12 → 选择12:00 → 选择3人 → 点击Book now成功' });
                              } else {
                                sendResponse({ message: '未找到Book now按钮', error: true });
                              }
                            }, 1000);
                          }, 300);
                        }, 300);
                      } else {
                        sendResponse({ message: '未找到数量增加按钮', error: true });
                      }
                    }, 1000);
                  } else {
                    sendResponse({ message: '未找到12:00选项，共找到' + options.length + '个选项', error: true });
                  }
                }, 2000);
              } else {
                sendResponse({ message: '未找到timeslot选择器或仍为disabled状态', error: true });
              }
            }, 1500);
          } else {
            sendResponse({ message: '未找到日期选择器', error: true });
          }
        }, 500);
      } else {
        sendResponse({ message: '未找到Select按钮', error: true });
      }

      return true;
    } catch (e) {
      sendResponse({ message: '执行错误: ' + e.message, error: true });
    }
  }
});
