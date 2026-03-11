// 自动化流程：点击Select → 选择日期 → 选择timeslot → 选择人数 → 点击Book now
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'execute') {
    try {
      const params = request.params || {};
      const { date = 'Mar 12', time = '12:00', adults = 3 } = params;

      console.log('=== 开始执行自动化流程 ===');
      console.log('参数:', params);

      // 步骤1：点击Select按钮展开详情
      const selectButtons = document.querySelectorAll('.card .klk-button-primary');
      console.log('步骤1 - 找到的Select按钮数量:', selectButtons.length);

      if (selectButtons.length > 0) {
        selectButtons[0].click();
        console.log('步骤1 - 已点击Select按钮');

        // 步骤2：等待2000ms后点击指定日期
        setTimeout(() => {
          const dateCells = document.querySelectorAll('.cell.cell-desktop');
          console.log('步骤2 - 找到的日期单元格数量:', dateCells.length);
          console.log('步骤2 - 查找日期:', date);

          let dateFound = false;
          // 移除空格用于匹配
          const dateMatch = date.replace(/\s+/g, '');

          // 先在当前显示的日期中查找
          for (let i = 0; i < dateCells.length; i++) {
            const cellText = dateCells[i].textContent.trim();
            const cellTextNoSpace = cellText.replace(/\s+/g, '');
            console.log(`步骤2 - 日期${i}内容:`, cellText);
            if (cellTextNoSpace.includes(dateMatch)) {
              dateCells[i].click();
              dateFound = true;
              console.log('步骤2 - 已点击日期:', date);

              // 找到了日期，继续执行后续步骤
              setTimeout(() => executeStep3(sendResponse, date, time, adults), 3000);
              break;
            }
          }

          // 如果没找到，尝试点击"All"展开更多日期
          if (!dateFound) {
            console.log('步骤2 - 未在默认日期中找到，尝试点击All展开');
            let allBtnFound = false;
            for (let i = 0; i < dateCells.length; i++) {
              const cellText = dateCells[i].textContent.trim();
              if (cellText === 'All' || cellText.includes('All')) {
                dateCells[i].click();
                allBtnFound = true;
                console.log('步骤2 - 已点击All');

                // 等待3000ms后在日历弹窗中查找日期
                setTimeout(() => {
                  // 查找日历弹窗中的日期元素
                  const calendarDates = document.querySelectorAll('.klk-date-picker-date:not(.klk-date-picker-date-disabled) .klk-date-picker-date-inner');
                  console.log('步骤2 - 日历弹窗中找到的可选日期数量:', calendarDates.length);

                  // 提取日期数字（如 "Mar 12" -> "12"）
                  const dateNum = date.match(/\d+/)?.[0] || date;
                  console.log('步骤2 - 查找日期数字:', dateNum);

                  let foundInCalendar = false;
                  for (let j = 0; j < calendarDates.length; j++) {
                    const dateText = calendarDates[j].textContent.trim();
                    console.log(`步骤2 - 日历日期${j}内容:`, dateText);
                    if (dateText === dateNum || dateText.includes(dateNum)) {
                      calendarDates[j].click();
                      foundInCalendar = true;
                      console.log('步骤2 - 已点击日历中的日期:', date);

                      // 等待日历选择完成后继续执行后续步骤
                      setTimeout(() => executeStep3(sendResponse, date, time, adults), 2000);
                      break;
                    }
                  }

                  if (!foundInCalendar) {
                    console.error('步骤2 - 日历中仍未找到日期:', date);
                    sendResponse({ message: `未找到日期: ${date}，日历中共找到${calendarDates.length}个可选日期`, error: true });
                  }
                }, 3000);
                break;
              }
            }

            if (!allBtnFound) {
              console.error('步骤2 - 未找到All按钮');
              sendResponse({ message: `未找到日期: ${date}，也未找到All按钮`, error: true });
            }
          }
        }, 2000);
      } else {
        console.error('步骤1 - 未找到Select按钮');
        sendResponse({ message: '未找到Select按钮', error: true });
      }

      return true;
    } catch (e) {
      console.error('执行错误:', e);
      sendResponse({ message: '执行错误: ' + e.message, error: true });
    }
  }
});

// 步骤3及后续的执行函数
function executeStep3(sendResponse, date, time, adults) {
  console.log('步骤3 - 开始执行');

  // 步骤3：点击timeslot下拉框
  const timeslotTrigger = document.querySelector('.timeslot-trigger.desktop');
  console.log('步骤3 - timeslot触发器存在:', !!timeslotTrigger);

  if (timeslotTrigger) {
    timeslotTrigger.click();
    console.log('步骤3 - 已点击timeslot触发器');

    // 步骤4：等待3000ms后点击指定时间选项
    setTimeout(() => {
      const options = document.querySelectorAll('.time-item');
      console.log('步骤4 - 找到的时间选项数量:', options.length);
      console.log('步骤4 - 查找时间:', time);

      let timeFound = false;
      // 移除空格用于匹配
      const timeMatch = time.replace(/\s+/g, '');
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

        if (increaseBtn) {
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
                  bookNowBtn.click();
                  console.log('步骤6 - 已点击Book now按钮');
                  sendResponse({ message: `成功: ${date} ${time} ${adults}人 → Book now` });
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
        } else {
          console.error('步骤5 - 未找到数量增加按钮');
          sendResponse({ message: '未找到数量增加按钮', error: true });
        }
      }, 2000);
    }, 3000);
  } else {
    console.error('步骤3 - 未找到timeslot选择器');
    sendResponse({ message: '未找到timeslot选择器', error: true });
  }
}
