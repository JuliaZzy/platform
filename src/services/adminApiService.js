import axios from 'axios';

// 可以在这里配置一个基础的 axios 实例，如果您的 API 都有共同的前缀或需要统一配置
const apiClient = axios.create({
  baseURL: '/api', // 假设 AdminPage 的所有API都在 /api 这个路径下
  // timeout: 10000, // 例如，设置超时
  // withCredentials: true, // 如果需要跨域cookie
});

// 一个可选的统一错误处理函数
const handleApiError = (error, contextMessage = 'API请求失败') => {
  console.error(`${contextMessage}:`, error.response || error.message || error);
  // 尝试从后端响应中提取更具体的错误信息
  const serverError = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message;
  const fallbackMessage = '操作失败，请检查网络或联系管理员。';
  
  // 抛出错误，让调用方可以捕获并处理 (例如显示给用户)
  throw new Error(serverError || fallbackMessage);
};

/**
 * 加载Admin页面表格数据
 * @param {string} currentTab - 当前激活的标签页标识 (如 'listed', 'nonlisted', 'finance-bank')
 * @param {object} params - 请求参数 (如 page, pageSize, filters, searchKeyword)
 * @returns {Promise<object>} - Promise，解析为 { data: Array, total: number }
 */
export const loadAdminTableData = async (currentTab, params = {}) => {
  let url = '';
  let isBackendPagingCapable = false; // 标记该接口是否支持后端分页和筛选

  switch (currentTab) {
    case 'listed':
      url = '/company/listed-companies-detail'; // 旧接口，可能不支持后端分页/筛选
      break;
    case 'nonlisted':
      url = '/company/non-listed-companies-detail'; // 旧接口，可能不支持后端分页/筛选
      break;
    case 'finance-bank':
      url = '/finance/data/bank';
      isBackendPagingCapable = true;
      break;
    case 'finance-stock':
      url = '/finance/data/stock';
      isBackendPagingCapable = true;
      break;
    case 'finance-other':
      url = '/finance/data/other';
      isBackendPagingCapable = true;
      break;
    default:
      console.error('adminApiService: 未知的 currentTab for loadData:', currentTab);
      throw new Error('无效的数据类型');
  }

  try {
    const response = await apiClient.get(url, { params }); // GET 请求通常用 params 传递查询参数
    
    if (isBackendPagingCapable) {
      return { 
        data: response.data?.data || [], 
        total: response.data?.total || 0 
      };
    } else {
      // 对于不支持后端分页的旧接口，数据直接在 response.data 或 response.data.rows
      const rows = response.data?.rows || response.data || [];
      return { data: rows, total: rows.length }; // total 由前端计算
    }
  } catch (error) {
    return handleApiError(error, `加载 ${currentTab} 数据失败`);
  }
};

/**
 * 上传Excel数据到指定表格 (追加模式)
 * @param {string} tableName - 数据库表名
 * @param {FormData} formData - 包含文件的 FormData 对象
 * @returns {Promise<object>} - 后端返回的响应数据 (例如 { message: '...', data: [...] })
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
 * @param {string} tableName - 数据库表名
 * @param {string|number} rowId - 要更新的行的ID
 * @param {string|null} newStatus - 新的状态值 ('delete', 'kept', null 等)
 * @returns {Promise<object>} - 后端返回的响应数据
 */
export const updateRowStatusInDb = async (tableName, rowId, newStatus) => {
  try {
    // 假设您的状态更新API是 PUT /adminpage/status/:tableName/:rowId
    const response = await apiClient.put(`/adminpage/status/${tableName}/${rowId}`, { status: newStatus });
    return response.data; 
  } catch (error) {
    return handleApiError(error, `更新行 ${rowId} (表: ${tableName}) 状态为 ${newStatus} 失败`);
  }
};

/**
 * 导出指定表格的数据为Excel
 * @param {string} tableName - 数据库表名
 */
export const exportTableToExcel = (dbTableName) => {
  if (!dbTableName) {
    console.error('exportTableToExcel: dbTableName is required.');
    // 可以选择抛出错误或直接返回，让调用方处理
    throw new Error('导出操作缺少必要的表名参数。');
  }

  // 假设您的 exportExcel.js 路由是挂载在 /api/export 下
  // 例如，如果 apiClient.defaults.baseURL 是 '/api'，那么这里就是 '/export/:tableName'
  const exportUrl = `${apiClient.defaults.baseURL || ''}/export/${encodeURIComponent(dbTableName)}`;
  
  console.log('Exporting Excel with URL (path param):', exportUrl);
  console.log('Note: Filters and searchKeyword are NOT sent to this backend endpoint version.');

  window.open(exportUrl); 
};
