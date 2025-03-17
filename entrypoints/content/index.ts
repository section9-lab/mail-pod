// 引入样式文件
import "./style.css";
// 引入内容脚本上下文模块
import { ContentScriptContext } from "wxt/client";



// 定义内容脚本的主入口
export default defineContentScript({
  // 设置"registration"为runtime，这样这个文件就不会在manifest中列出
  registration: "runtime",
  // 使用空数组作为matches，以防止使用`registration: "runtime"`时添加任何主机权限。
  matches: [],
  // 将CSS注入到shadow root中
  cssInjectionMode: "ui",

  // 主函数，异步执行
  async main(ctx) {
    console.log("内容脚本已执行！");
    // 创建用户界面
    const ui = await createUi(ctx);
    // 挂载UI
    ui.mount();
    // 可选地，返回一个值给后台脚本
    return "Hello world!";
  },
});



/**
 * 创建用户界面
 * @param ctx 内容脚本上下文
 * @returns 返回创建的UI实例
 */
async function createUi(ctx: ContentScriptContext) {
  // 这里我们假设你已经有了一个特定的XPath表达式来定位目标元素
  const targetXPath1 = "//*[@id=':1s']/div[1]/div[2]/div[3]"
  const targetXPath = "//*[contains(@id, ':') and string-length(@id) = 3]/div[1]/div[2]/div[3]";
  const targetElement = locateElementByXPath(targetXPath); 
  if (targetElement instanceof HTMLElement) { 
    const targetText = targetElement.textContent;

// 定义要post的数据
interface RequestConfig {
  retries?: number;
  retryDelay?: number;
}

async function fetchWithRetry(url: string, options: RequestInit = {}, config: RequestConfig = {}) {
  const { retries = 3, retryDelay = 1000 } = config;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, retryDelay * (2 ** i)));
    }
  }
}

function updateUiStatus(status: 'loading' | 'success' | 'error' | 'retrying', message: string) {
  const container = document.querySelector('.pod-ui-container');
  if (!container) return;

  // 清除旧内容
  container.innerHTML = '';

  // 创建新状态元素
  const statusElement = document.createElement('div');
  statusElement.className = `pod-ui-status pod-ui-${status}`;
  statusElement.textContent = message;

  container.appendChild(statusElement);
}

const postData = { emailContent: targetText };
console.log(postData);

async function postDatas() {
  try {
    updateUiStatus('loading', '正在发送邮件...');
    
    let response = await fetchWithRetry('https://mail-pod.section9lab.workers.dev/', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(postData),
    }, { retries: 3, retryDelay: 1000 });

    updateUiStatus('success', '邮件发送成功');

    console.log(response)
    const postPath1 = "//*[@id=':4']/div"
    const postPath = "//*[@id=':1']/div/div[2]/div/div[2]/div[1]/div/div[2]/div[2]"
    const postElement = locateElementByXPath(postPath); 
    console.log(postElement)
    
    // 处理响应数据
    if (postElement instanceof HTMLElement) { 
      const fixedDivId = "response-display-div";
  
      // Check if the div already exists
      let newDiv = document.getElementById(fixedDivId);
      
      if (!newDiv) {
        // Create a new div if it doesn't exist
        newDiv = document.createElement("div");
        newDiv.id = fixedDivId;
        
        // Insert the new div after the target element
        if (postElement.parentNode) {
          //postElement.parentNode.insertBefore(newDiv, postElement.nextSibling);
          postElement.parentNode.appendChild(newDiv);
        }
      }
      //newDiv.textContent = response;

      // Format the response to preserve line breaks
      const formattedResponse = formatResponseWithLineBreaks(response);
      
      // Update the div content with properly formatted text
      newDiv.innerHTML = formattedResponse;
  
      // Style the div based on its content
      styleBasedOnContent(newDiv, response);
      
      // Insert the new div after the target element (not inside it)
      if (postElement.parentNode) {
        postElement.parentNode.insertBefore(newDiv, postElement.nextSibling);
      }

      //postElement.appendChild(newDiv);
      console.log(postElement)
    } else {
      console.error("Target element not found");
    }
    
  } catch (error) {
    console.error('Error:', error);
    updateUiStatus('error', '邮件发送失败。点击重试');
    
    // 添加重试按钮
    const container = document.querySelector('.pod-ui-container');
    if (container) {
      const retryButton = document.createElement('button');
      retryButton.textContent = '重试';
      retryButton.onclick = postDatas;
      container.appendChild(retryButton);
    }
  }
}
    postDatas();
  }

  function formatResponseWithLineBreaks(response) {
    // Convert to string if it's not already
    let text = typeof response === 'string' ? response : JSON.stringify(response, null, 2);
    
    // Replace newlines with <br> tags
    text = text.replace(/\n/g, '<br>');
    
    // Preserve spaces
    text = text.replace(/  /g, '&nbsp;&nbsp;');
    
    return text;
  }
  
  function styleBasedOnContent(div, content) {
    // Add some basic styling
    div.style.padding = "10px";
    div.style.margin = "10px 0";
    div.style.borderRadius = "5px";
    
    // Convert content to string for analysis if it's not already
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    
    // Determine style based on content
    if (contentStr.includes("error") || contentStr.includes("失败")) {
      // Error styling
      div.style.backgroundColor = "#ffebee";
      div.style.color = "#c62828";
      div.style.border = "1px solid #ef9a9a";
    } else if (contentStr.includes("success") || contentStr.includes("成功")) {
      // Success styling
      div.style.backgroundColor = "#e8f5e9";
      div.style.color = "#2e7d32";
      div.style.border = "1px solid #a5d6a7";
    } else {
      // Neutral styling
      div.style.backgroundColor = "#f5f5f5";
      div.style.color = "#424242";
      div.style.border = "1px solid #e0e0e0";
    }
  }

  return createShadowRootUi(ctx, {
    // UI的名字
    name: "active-tab-ui",
    // UI的位置设置为inline
    position: "inline",
    // 在指定元素之前插入UI
    append: "before",
    // 当挂载完成时调用此回调函数
    onMount(container) {
      container.className = 'pod-ui-container';
      const app = document.createElement("h");
      app.textContent = "Test Pod is running";
      container.append(app);
    },
  });
}


function locateElementByXPath(targetXPath: string): Node | null {
  const result = document.evaluate(
    targetXPath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  );
  return result.singleNodeValue;
}
