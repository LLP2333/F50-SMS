const isArray = (raw) => {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        parsed = null;
    }
    // 判断是否为数组
    if (Array.isArray(parsed)) {
        return true
    } else {
        return false
    }
}

function requestInterval(callback, interval) {
    let lastTime = 0;
    let timeoutId = null;

    function loop(timestamp) {
        if (!lastTime) lastTime = timestamp; // 初始化上次时间
        const delta = timestamp - lastTime; // 计算时间差

        if (delta >= interval) {
            callback(); // 执行任务
            lastTime = timestamp; // 更新上次时间
        }

        timeoutId = requestAnimationFrame(loop); // 继续请求下一帧
    }

    timeoutId = requestAnimationFrame(loop); // 启动动画循环

    // 返回清除函数
    return () => cancelAnimationFrame(timeoutId);
}

function copyText(e) {
    const text = e.target.innerText;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        // 浏览器支持
        navigator.clipboard.writeText(text).then(() => {
            createToast('已经复制到剪贴板！', 'green')
        }).catch(err => {
            createToast('复制失败', 'red')
        });
    } else {
        // 创建text area
        let textArea = document.createElement("textarea");
        textArea.value = text;
        // 使text area不在viewport，同时设置不可见
        textArea.style.position = "absolute";
        textArea.style.opacity = 0;
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        return new Promise((res, rej) => {
            // 执行复制命令并移除文本框
            document.execCommand('copy') ? res() : rej();
            textArea.remove();
        }).then(() => {
            createToast('已经复制到剪贴板！', 'green')
        }).catch(() => {
            createToast('复制失败', 'red')
        });
    }
}

//按照信号dbm强度绘制信号强度栏(-113到-51)
function kano_parseSignalBar(val, min = -125, max = -81, green_low = -90, yellow_low = -100) {
    let strength = Number(val)
    strength = strength > max ? max : strength
    strength = strength < min ? min : strength
    const bar = document.createElement('span')
    const strengths = Array.from({ length: Math.abs((min - max)) + 1 }, (_, i) => min + i);
    const index = strengths.findIndex(i => i >= strength) // 找到对应的索引
    const percent = (index / strengths.length) * 100 // 计算百分比
    const progress = document.createElement('span')
    const text = document.createElement('span')

    text.innerHTML = Number(val)
    bar.className = 'signal_bar'
    text.className = 'text'
    progress.className = 'signal_bar_progress'
    progress.style.transition = 'all 0.5s'
    progress.style.width = `${percent}%`
    progress.style.opacity = '.6'

    if (strength >= green_low) {
        progress.style.backgroundColor = 'green';
    } else if (strength >= yellow_low) {
        progress.style.backgroundColor = 'orange';
    } else {
        progress.style.backgroundColor = 'red';
    }

    bar.appendChild(progress)
    bar.appendChild(text)
    return bar.outerHTML
}

function kano_getSignalEmoji(strength) {
    const signals = ["📶 ⬜⬜⬜⬜", "📶 🟨⬜⬜⬜", "📶 🟩🟨⬜⬜", "📶 🟩🟩🟨⬜", "📶 🟩🟩🟩🟨", "📶 🟩🟩🟩🟩"];
    return signals[Math.max(0, Math.min(strength, 5))]; // 确保输入在 0-5 之间
}

function kano_formatTime(seconds) {
    if (seconds < 60) {
        return `${seconds} 秒`;
    } else if (seconds < 3600) {
        return `${(seconds / 60).toFixed(1)} 分钟`;
    } else {
        return `${(seconds / 3600).toFixed(1)} 小时`;
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';

    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

function decodeBase64(base64String) {
    // 将Base64字符串分成每64个字符一组
    const padding = base64String.length % 4 === 0 ? 0 : 4 - (base64String.length % 4)
    base64String += '='.repeat(padding)

    // 使用atob()函数解码Base64字符串
    const binaryString = window.atob(base64String)

    // 将二进制字符串转换为TypedArray
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)

    // 将TypedArray转换为字符串
    return new TextDecoder('utf-8').decode(bytes)
}

function encodeBase64(plainText) {
    // 将字符串转为 Uint8Array（二进制形式）
    const bytes = new TextEncoder().encode(plainText)

    // 把二进制转换为字符串（每个字节对应一个字符）
    let binaryString = ''
    for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i])
    }

    // 使用 btoa() 编码为 Base64
    return window.btoa(binaryString)
}

function createToast(text, color, delay = 3000) {
    const toastContainer = document.querySelector("#toastContainer")
    const toastEl = document.createElement('div')
    toastEl.style.padding = '10px'
    toastEl.style.width = "fit-content"
    toastEl.style.position = "relative"
    toastEl.style.top = "0px"
    toastEl.style.color = color || 'while'
    toastEl.style.backgroundColor = 'var(--dark-card-bg)'
    toastEl.style.transform = `scale(1)`
    toastEl.style.transition = `all .3s`
    toastEl.style.opacity = `0`
    toastEl.style.boxShadow = '0 0 10px 0 #87ceeb70'
    toastEl.style.fontWeight = 'bold'
    toastEl.style.backdropFilter = 'blur(10px)'
    toastEl.style.borderRadius = '6px'
    toastEl.innerHTML = text;
    const id = 'toastkano'
    toastEl.setAttribute('class', id);
    toastContainer.appendChild(toastEl)
    setTimeout(() => {
        toastEl.style.opacity = `1`
    }, 0);
    let timer = null
    setTimeout(() => {
        toastEl.style.opacity = `0`
        toastEl.style.transform = `scale(0)`
        toastEl.style.top = '-' + toastEl.getBoundingClientRect().height + 'px'
        clearTimeout(timer)
        timer = setTimeout(() => {
            toastContainer.removeChild(toastEl)
        }, 300);
    }, delay);
}

let modalTimer = null
function closeModal(txt, time = 300) {
    if (txt == '#smsList') smsSender && smsSender()
    let el = document.querySelector(txt)
    if (!el) return
    el.style.opacity = 0
    modalTimer && clearTimeout(modalTimer)
    modalTimer = setTimeout(() => {
        el.style.display = 'none'
    }, time)
}

function showModal(txt, time = 300, opacity = '1') {
    let el = document.querySelector(txt)
    if (!el) return
    el.style.opacity = 0
    el.style.display = ''
    setTimeout(() => {
        el.style.opacity = opacity
    }, 10)
}

const debounce = (func, delay) => {
    let timer;
    return function (...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

function hsvToRgb(h, s, v) {
    let c = v * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = v - c;
    let r = 0, g = 0, b = 0;

    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else[r, g, b] = [c, 0, x];

    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

// 创建一个开关
function createSwitch({ text, value, className = '', onChange, fontSize = 14 }) {
    const container = document.createElement('div');
    container.className = 'Switch';
    container.style.fontSize = fontSize + 'px'

    const label = document.createElement('label');
    label.style.display = "flex"
    label.className = `outer ${className}`;

    const span = document.createElement('span');
    span.className = 'text';
    span.textContent = text;

    const switchDiv = document.createElement('div');
    switchDiv.className = 'switch text-center p-2';
    if (value) switchDiv.classList.add('active');

    const dot = document.createElement('div');
    dot.className = 'dot';
    switchDiv.appendChild(dot);

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = value;
    input.className = 'inline-block w-5 h-5 align-sub';
    input.addEventListener('click', (e) => {
        const checked = e.target.checked;
        if (checked) {
            switchDiv.classList.add('active');
        } else {
            switchDiv.classList.remove('active');
        }
        onChange?.(checked);
    });

    label.appendChild(span);
    label.appendChild(switchDiv);
    label.appendChild(input);
    container.appendChild(label);

    return container;
}


const createCollapseObserver = (boxEl = null) => {
    if (!boxEl) return
    const box = boxEl.querySelector('.collapse_box')
    const resizeObserver = new ResizeObserver(() => {
        const value = boxEl.getAttribute('data-name');
        if (!box || value != 'open') return
        boxEl.style.height = box.getBoundingClientRect().height + 'px'
    });
    resizeObserver.observe(box);
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (
                mutation.type === 'attributes' &&
                mutation.attributeName === 'data-name'
            ) {
                const newValue = boxEl.getAttribute('data-name');
                if (!box) return
                if (newValue == 'open') {
                    boxEl.style.height = box.getBoundingClientRect().height + 'px'
                    boxEl.style.overflow = 'hidden'
                } else {
                    boxEl.style.height = '0'
                    boxEl.style.overflow = 'hidden'
                }
            }
        }
    })
    observer.observe(boxEl, {
        attributes: true, // 监听属性变化
        attributeFilter: ['data-name'], // 只监听 data-name 属性
    });
    return {
        el: boxEl
    }
}

const collapseGen = (btn_id, collapse_id, storName) => {
    const { el: collapseMenuEl } = createCollapseObserver(document.querySelector(collapse_id))
    // 对于锁频和锁基站部分，默认为"close"状态
    if (storName === 'collapse_lkband' || storName === 'collapse_lkcell') {
        collapseMenuEl.dataset.name = localStorage.getItem(storName) || 'close'
    } else {
        collapseMenuEl.dataset.name = localStorage.getItem(storName) || 'open'
    }
    const collapseBtn = document.querySelector(btn_id)
    const switchComponent = createSwitch({
        value: collapseMenuEl.dataset.name == 'open',
        className: storName,
        onChange: (newVal) => {
            if (collapseMenuEl && collapseMenuEl.dataset) {
                collapseMenuEl.dataset.name = newVal ? 'open' : 'close'
                localStorage.setItem(storName, collapseMenuEl.dataset.name)
            }
        }
    });
    collapseBtn.appendChild(switchComponent);
}