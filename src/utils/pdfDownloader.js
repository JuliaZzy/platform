import axios from 'axios';

/**
 * @description: 将 Blob 对象保存为文件并触发浏览器下载。
 * @param {Blob} blob - 要保存的 Blob 数据 (例如 PDF 文件)。
 * @param {string} filename - 下载时使用的文件名。
 */
export function saveBlob(blob, filename) {
  // 确保接收到的是 Blob 对象
  if (!(blob instanceof Blob)) {
      console.error('saveBlob Error: Input is not a Blob object.');
      alert('下载处理错误：无法识别文件数据。');
      return;
  }

  const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * @description: 调用后端接口下载 PDF 文件。
 * @param {object} options - 下载选项。
 * @param {string} options.apiUrl - 后端导出接口的 URL (例如 '/api/lasset/export')。
 * @param {object} [options.filters={}] - 发送给后端的筛选条件对象。
 * @param {string[]} [options.excludedColumns=[]] - (可选) 发送给后端的要排除的列名数组。
 * @param {string} [options.defaultFilename='download.pdf'] - 默认下载文件名。
 * @param {function} [options.onStart] - (可选) 下载开始时调用的回调函数。
 * @param {function} [options.onFinish] - (可选) 下载结束时 (无论成功失败) 调用的回调函数。
 * @param {function} [options.onError] - (可选) 下载失败时调用的回调函数, 接收错误信息作为参数。
 */
export async function downloadPdf({ 
    apiUrl, 
    filters = {}, 
    excludedColumns = [], 
    defaultFilename = 'download.pdf', 
    onStart, 
    onFinish, 
    onError 
}) {
    if (typeof onStart === 'function') onStart();

    const handleError = (message) => {
        console.error('PDF Download Error:', message);
        if (typeof onError === 'function') {
            onError(message);
        } else {
            alert(message); // 如果没有提供 onError 回调，则使用 alert
        }
    };

    try {
        const payload = { filters };
        if (Array.isArray(excludedColumns) && excludedColumns.length > 0) {
            payload.excludedColumns = excludedColumns;
        }

        const response = await axios.post(apiUrl, payload, { responseType: 'blob' });

        // 检查响应是否是 PDF Blob
        if (response.data instanceof Blob && response.data.type === 'application/pdf') {
            let filename = defaultFilename;
            const contentDisposition = response.headers['content-disposition'];
            
            if (contentDisposition) {
                // 尝试解析更标准的 RFC 6266 filename*=UTF-8'' 格式
                const utf8FilenameMatch = contentDisposition.match(/filename\*=UTF-8''([^"]+)"?/i);
                if (utf8FilenameMatch && utf8FilenameMatch[1]) {
                    filename = decodeURIComponent(utf8FilenameMatch[1]);
                } else {
                    // 回退到解析简单的 filename="xxx" 格式
                    const simpleFilenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
                    if (simpleFilenameMatch && simpleFilenameMatch[1]) {
                        filename = decodeURIComponent(simpleFilenameMatch[1]); // 仍然尝试解码
                    }
                }
            }
            saveBlob(response.data, filename);

        } else if (response.data instanceof Blob) {
            // 如果是 Blob 但不是 PDF，尝试读取错误信息
            const errorText = await response.data.text();
            try {
                const errorJson = JSON.parse(errorText);
                handleError(`导出失败: ${errorJson.error || '服务器返回了非PDF文件。'}`);
            } catch (e) {
                handleError(`导出失败: 服务器返回了非PDF文件 (${response.data.type})。`);
            }
        } else {
            handleError('导出失败：服务器未返回有效的PDF文件。');
        }

    } catch (error) {
        let errorMessage = '下载失败，请检查网络或联系管理员。';
        if (error.response && error.response.data && error.response.data instanceof Blob) {
            try {
                const errorText = await error.response.data.text();
                const errorJson = JSON.parse(errorText);
                if (errorJson && errorJson.error) {
                    errorMessage = `导出失败: ${errorJson.error}`;
                }
            } catch (e) { /* Blob 不是 JSON, 使用默认错误信息 */ }
        } else if (error.response && error.response.data && error.response.data.error) {
             errorMessage = `导出失败: ${error.response.data.error}`;
        } else if (error.message) {
            errorMessage = `下载失败: ${error.message}`;
        }
        handleError(errorMessage);
    } finally {
        if (typeof onFinish === 'function') onFinish();
    }
}
