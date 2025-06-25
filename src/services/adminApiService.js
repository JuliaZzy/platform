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
 * @param {string} currentTab
 * @param {object} params
 * @returns {Promise<object>}
 */
export const loadAdminTableData = async (currentTab, params = {}) => {
  const url = `/admintable/tabledata/${currentTab}`; 
  let queryParams = { ...params };
  if (queryParams.filters && typeof queryParams.filters === 'object') {
    queryParams.filters = JSON.stringify(queryParams.filters);
  }

  console.log(`[adminApiService] Calling loadAdminTableData for tab: ${currentTab}, URL: ${url}, Params:`, queryParams);

  try {
    const response = await apiClient.get(url, { params: queryParams }); 

    return { 
      data: response.data?.data || [], 
      total: response.data?.total || 0,
      tableLastUpdate: response.data?.tableLastUpdate || null
    };
  } catch (error) {
    return handleApiError(error, `加载 Admin Tab [${currentTab}] 数据失败`);
  }
};

/**
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
  const endpoint = `/admintable/distinct-values/${tabKey}`;
  try {
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`[AdminApiService] Failed to load distinct column values for tab ${tabKey}:`, error);
    throw new Error(error.response?.data?.message || `获取 '${tabKey}' 表格的筛选选项失败`);
  }
}

/**
 * 保存报告的排序
 * @param {Array<number|string>} orderedIds - 排序后的报告ID数组
 * @returns {Promise<object>}
 */
export const saveReportOrder = async (orderedIds) => {
  try {
    const response = await apiClient.post('/reports/order', { orderedIds });
    return response.data;
  } catch (error) {
    return handleApiError(error, '保存报告顺序失败');
  }
};