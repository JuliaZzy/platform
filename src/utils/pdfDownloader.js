import axios from 'axios';

/**
 * @description: 将 Blob 对象保存为文件并触发浏览器下载。
 * @param {Blob} blob - 要保存的 Blob 数据 (例如 PDF 文件)。
 * @param {string} filename - 下载时使用的文件名。
 */
export function saveBlob(blob, filename) {
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
 * @description: 下载PDF
 * @param {object} options
 * @param {string} options.apiUrl
 * @param {object} [options.filters={}]
 * @param {string[]} [options.excludedColumns=[]]
 * @param {string} [options.defaultFilename='download.pdf']
 * @param {function} [options.onStart]
 * @param {function} [options.onFinish]
 * @param {function} [options.onError]
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
            alert(message);
        }
    };

    try {
        const payload = { filters };
        if (Array.isArray(excludedColumns) && excludedColumns.length > 0) {
            payload.excludedColumns = excludedColumns;
        }

        const response = await axios.post(apiUrl, payload, { responseType: 'blob' });

        if (response.data instanceof Blob && response.data.type === 'application/pdf') {
            let filename = defaultFilename;
            const contentDisposition = response.headers['content-disposition'];
            
            if (contentDisposition) {
                const utf8FilenameMatch = contentDisposition.match(/filename\*=UTF-8''([^"]+)"?/i);
                if (utf8FilenameMatch && utf8FilenameMatch[1]) {
                    filename = decodeURIComponent(utf8FilenameMatch[1]);
                } else {
                    const simpleFilenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
                    if (simpleFilenameMatch && simpleFilenameMatch[1]) {
                        filename = decodeURIComponent(simpleFilenameMatch[1]);
                    }
                }
            }
            saveBlob(response.data, filename);

        } else if (response.data instanceof Blob) {
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
