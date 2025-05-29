import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // 假设所有API都在 /api 这个路径下
});

const handleApiError = (error, contextMessage = 'API请求失败') => {
  console.error(`${contextMessage}:`, error.response || error.message || error);
  const serverError = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message;
  const fallbackMessage = '操作失败，请检查网络或联系管理员。';
  throw new Error(serverError || fallbackMessage);
};

/**
 * 加载Admin页面表格数据
 * @param {string} currentTab - 当前激活的标签页标识 (如 'listed', 'nonlisted', 'finance-bank')
 * @param {object} params - 请求参数 (如 page, pageSize, filters 对象, searchKeyword 字符串)
 * @returns {Promise<object>} - Promise，解析为 { data: Array, total: number }
 */
export const loadAdminTableData = async (currentTab, params = {}) => {
  // ✅ 修改点 1: 构建指向新的 Admin 专用数据接口的 URL
  const url = `/admintable/tabledata/${currentTab}`; 

  // ✅ 修改点 2: 准备要发送的查询参数
  let queryParams = { ...params }; // 复制一份，以避免修改原始 params 对象

  // 如果 params 中包含 filters 对象，将其 JSON 字符串化
  // 后端 adminTableData.js 会解析这个 JSON 字符串
  if (queryParams.filters && typeof queryParams.filters === 'object') {
    queryParams.filters = JSON.stringify(queryParams.filters);
  }

  console.log(`[adminApiService] Calling loadAdminTableData for tab: ${currentTab}, URL: ${url}, Params:`, queryParams);

  try {
    // ✅ 修改点 3: 所有 AdminPage 的数据加载都走这条路径，并期望后端处理分页/筛选/搜索
    const response = await apiClient.get(url, { params: queryParams }); 
    
    // 后端 adminTableData.js 应该返回 { data: Array, total: number } 结构
    return { 
      data: response.data?.data || [], 
      total: response.data?.total || 0 
    };
  } catch (error) {
    return handleApiError(error, `加载 Admin Tab [${currentTab}] 数据失败`);
  }
};

/**
 * 上传Excel数据到指定表格 (追加模式)
 * (此函数保持不变，它调用的 /api/upload/append 接口是独立的)
 * @param {string} tableName - 数据库表名
 * @param {FormData} formData - 包含文件的 FormData 对象
 * @returns {Promise<object>} - 后端返回的响应数据
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
 * (此函数保持不变，它调用的 /api/adminpage/status/... 接口是独立的)
 * @param {string} tableName - 数据库表名
 * @param {string|number} rowId - 要更新的行的ID
 * @param {string|null} newStatus - 新的状态值 ('delete', 'kept', null 等)
 * @returns {Promise<object>} - 后端返回的响应数据
 */
export const updateRowStatusInDb = async (tableName, rowId, newStatus) => {
  try {
    // 假设您的状态更新API是 PUT /adminpage/status/:tableName/:rowId (或者您选择的其他 admin 专用路径)
    const response = await apiClient.put(`/adminpage/status/${tableName}/${rowId}`, { status: newStatus });
    return response.data; 
  } catch (error) {
    return handleApiError(error, `更新行 ${rowId} (表: ${tableName}) 状态为 ${newStatus} 失败`);
  }
};

/**
 * 导出指定表格的数据为Excel
 * (此函数保持不变，它调用的 /api/export/:tableName 接口是独立的)
 * @param {string} dbTableName - 数据库表名
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