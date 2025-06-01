import axios from 'axios';

/**
 * @description
 * @param {string} tabKey
 * @returns {Promise<Object>} 
 */

const apiClient = axios.create({
  baseURL: '/api',
});

const handleApiError = (error, contextMessage = 'API请求失败') => {
  console.error(`${contextMessage}:`, error.response || error.message || error);
  const serverError = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message;
  const fallbackMessage = '操作失败，请检查网络或联系管理员。';
  throw new Error(serverError || fallbackMessage);
};

/**
 * 加载Admin页面表格数据
 * @param {string} currentTab
 * @param {object} params
 * @returns {Promise<object>}
 */
export const loadAdminTableData = async (currentTab, params = {}) => {
  // ✅ 1: 构建指向新的 Admin 专用数据接口的 URL
  const url = `/admintable/tabledata/${currentTab}`; 

  // ✅ 2: 准备要发送的查询参数
  let queryParams = { ...params };

  // 如果 params 中包含 filters 对象，将其 JSON 字符串化
  // 后端 adminTableData.js 会解析这个 JSON 字符串
  if (queryParams.filters && typeof queryParams.filters === 'object') {
    queryParams.filters = JSON.stringify(queryParams.filters);
  }

  console.log(`[adminApiService] Calling loadAdminTableData for tab: ${currentTab}, URL: ${url}, Params:`, queryParams);

  try {
    // ✅ 3: 所有 AdminPage 的数据加载都走这条路径，并期望后端处理分页/筛选/搜索
    const response = await apiClient.get(url, { params: queryParams }); 

    return { 
      data: response.data?.data || [], 
      total: response.data?.total || 0 
    };
  } catch (error) {
    return handleApiError(error, `加载 Admin Tab [${currentTab}] 数据失败`);
  }
};

/**
 * 上传Excel数据到指定表格
 * @param {string} tableName
 * @param {FormData} formData
 * @returns {Promise<object>}
 */
export const uploadExcelData = async (tableName, formData) => {
  try {
    const response = await apiClient.post(`/upload/append?tableName=${tableName}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, `上传数据到表 ${tableName} 失败`);
  }
};

/**
 * 更新指定表格中某一行数据的状态
 * @param {string} tableName
 * @param {string|number} rowId
 * @param {string|null} newStatus
 * @returns {Promise<object>}
 */
export const updateRowStatusInDb = async (tableName, rowId, newStatus) => {
  try {
    const response = await apiClient.put(`/adminpage/status/${tableName}/${rowId}`, { status: newStatus });
    return response.data; 
  } catch (error) {
    return handleApiError(error, `更新行 ${rowId} (表: ${tableName}) 状态为 ${newStatus} 失败`);
  }
};

/**
 * 导出指定表格的数据为Excel
 * @param {string} dbTableName
 */
export const exportTableToExcel = (dbTableName) => {
  if (!dbTableName) {
    console.error('exportTableToExcel: dbTableName is required.');
    throw new Error('导出操作缺少必要的表名参数。');
  }
  const exportUrl = `${apiClient.defaults.baseURL || ''}/export/${encodeURIComponent(dbTableName)}`;
  console.log('Exporting Excel with URL (path param):', exportUrl);
  window.open(exportUrl); 
};

export async function loadDistinctColumnValues(tabKey) {
  // 确保这里的 API 路径与你后端定义的路由一致
  const endpoint = `/admintable/distinct-values/${tabKey}`;
  try {
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`[AdminApiService] Failed to load distinct column values for tab ${tabKey}:`, error);
    throw new Error(error.response?.data?.message || `获取 '${tabKey}' 表格的筛选选项失败`);
  }
}
