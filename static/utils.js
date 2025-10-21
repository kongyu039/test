/**
 * 打字机效果
 * @param {HTMLElement} element HTML元素
 * @param {string[]} strList 标语数组
 * @param {number} [speed] 速度
 */
function elemTypewriter(element, strList, speed = 222) {
  if (element == null || strList == null || strList.length === 0) return
  let currentLength = 0 // 当前字符串长度
    , currentStrIndex = 0 // 当前标语索引
    , direction = 1 // 方向
  element.innerText = ''
  /** 类型字符打印 */
  function typeCharacter() {
    const tempStr = strList[currentStrIndex]
      , tempLength = tempStr.length
    element.innerText = tempStr.slice(0, currentLength) // 添加下一个字符
    if (currentLength >= tempLength) direction = -1
    if (currentLength <= 0) {
      direction = 1
      currentStrIndex = Math.floor(Math.random() * (strList.length))
    }
    currentLength += direction
  }
  return setInterval(typeCharacter, speed)
}

/**
 * html元素自增动画
 * @param elem {HTMLElement} elem元素
 * @param [target=0] {number} 目标
 * @param [duration=2000] {number} 时间
 */
function incCounter(elem, target = 0, duration = 2000) {
  const start = 0 // 起始值
  const stepTime = Math.abs(Math.floor(duration / target)) // 每步的时间
  let current = start // 当前值

  const timer = setInterval(() => {
    current += 1 // 每次增加1
    elem.textContent = current // 更新显示

    // 添加 CSS 动画类名以实现动画效果
    elem.style.opacity = 0 // 先隐藏
    setTimeout(() => {
      elem.style.opacity = 1 // 再显示
    }, 50) // 小延迟，确保隐藏后再显示

    // 如果达到了目标值，则清除定时器
    if (current >= target) {
      clearInterval(timer)
    }
  }, stepTime)
}

/**
 * 时间戳毫秒 YYYY/MM/dd
 * @param {number} ms 时间戳
 * @return {string} YYYY/MM/dd
 */
function timestampToYMd(ms) {
  return new Date(ms).toLocaleDateString('zh-CN', {year: 'numeric', month: '2-digit', day: '2-digit'})
}

/**
 * 时间戳毫秒 YYYY/MM/dd HH:mm:ss
 * @param {number} ms 时间戳
 * @return {string} YYYY/MM/dd HH:mm:ss
 */
function timestampToYMdHMs(ms) {return new Date(ms).toLocaleString('zh-CN')}

/**
 * 时间戳毫秒 YYYY/MM/dd HH:mm
 * @param {number} ms 时间戳
 * @return {string} YYYY/MM/dd HH:mm
 */
function timestampToYMdHM(ms) {
  return new Date(ms).toLocaleString('zh-CN', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})
}

/**
 * 通过时间戳和文章aid组成postUrl
 * @param ms {number} 时间戳ms
 * @param postId {number} 文章id
 * @return {string} postUrl
 */
function postUrlHandler(ms, postId) {return "/posts/" + timestampToYMd(ms) + "/" + postId + ".html"}

/**
 * 运行时间 N年N天N时N分
 * @param ms 时间戳ms
 * @return {{hour: number, year: number, day: number, minute: number}}
 */
function stableRunningTime(ms) {
  const oldDate = new Date(ms), newDate = new Date()
  const timeMs = newDate.getTime() - oldDate.getTime()
  const yearCalc = 365 * 24 * 60 * 60 * 1000
    , year = Math.floor(timeMs / yearCalc)
    , dayCalc = 24 * 60 * 60 * 1000
    , day = Math.floor((timeMs - (yearCalc * year)) / dayCalc)
    , hourCalc = 60 * 60 * 1000
    , hour = Math.floor((timeMs - (yearCalc * year) - (dayCalc * day)) / hourCalc)
    , minuteCalc = 60 * 1000
    , minute = Math.floor((timeMs - (yearCalc * year) - (dayCalc * day) - (hourCalc * hour)) / minuteCalc)
  return {year, day, hour, minute}
}

/**
 * 运行时间 N年N天N时N分
 * @param ms 毫秒时间戳
 * @return {string}
 */
function stableRunningTimeStr(ms) {
  const tempTime = stableRunningTime(ms)
  return `${ tempTime.year }年${ tempTime.day }天${ tempTime.hour }小时${ tempTime.minute }分`
}