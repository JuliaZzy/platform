import { ref, onMounted, onUnmounted } from 'vue';

// 导出一个名为 useResponsiveCharts 的函数
export function useResponsiveCharts() {
  // 定义响应式的 isMobile 状态
  const isMobile = ref(window.innerWidth <= 768);

  // 更新状态的函数
  const handleResize = () => {
    isMobile.value = window.innerWidth <= 768;
  };

  // 在组件挂载时添加监听器
  onMounted(() => {
    window.addEventListener('resize', handleResize);
  });

  // 在组件卸载时移除监听器
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });

  // 返回响应式状态，以便组件可以使用
  return {
    isMobile
  };
}