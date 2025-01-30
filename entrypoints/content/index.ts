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
function createUi(ctx: ContentScriptContext) {
  // 这里我们假设你已经有了一个特定的XPath表达式来定位目标元素
  const targetXPath = "/html/body/div[6]/div[3]/div/div[2]/div[2]/div/div/div/div[2]/div/div[1]/div/div[2]/div/div[2]/div[2]/div/div[3]/div/div/div/div/div/div[1]/div[2]/div[3]"; // 示例XPath表达式
  const targetElement = locateElementByXPath(targetXPath); 

  if (targetElement) {
    // 创建一个新的div元素
    const newDiv = document.createElement("div");
    newDiv.textContent = "这是通过XPath添加的新div";

    // 将新创建的div添加到目标元素中
    targetElement.appendChild(newDiv);
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
      // 创建一个新的段落元素
      const app = document.createElement("h");
      // 设置段落元素的文字内容
      app.textContent = "你好，当前活动标签页！";
      // 将段落元素添加到容器中
      container.append(app);
    },
  });
}

function locateElementByXPath(xpathToExecute) {
  const result = document.evaluate(xpathToExecute, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  return result.singleNodeValue;
}