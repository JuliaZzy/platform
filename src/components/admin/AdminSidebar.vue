<template>
  <div>
    <aside :class="['sidebar', { collapsed: isCollapsed }]">
      <div class="sidebar-title" v-if="!isCollapsed">
        数据明细管理
        <button class="collapse-btn" @click="$emit('toggle')">◀</button>
      </div>
      <nav class="menu" v-if="!isCollapsed">
        <div class="menu-item" :class="{ active: activeTab === 'listed' }" @click="$emit('switch-tab', 'listed')">
          上市公司数据
        </div>
        <div class="menu-item" :class="{ active: activeTab === 'nonlisted' }" @click="$emit('switch-tab', 'nonlisted')">
          非上市公司数据
        </div>
        <div class="menu-item" :class="{ active: ['finance-bank', 'finance-stock', 'finance-other'].includes(activeTab) }">
          数据资产融资
        </div>
        <div class="menu-subitem" :class="{ active: activeTab === 'finance-bank' }" @click="$emit('switch-tab', 'finance-bank')">
          数据资产增信银行贷款
        </div>
        <div class="menu-subitem" :class="{ active: activeTab === 'finance-stock' }" @click="$emit('switch-tab', 'finance-stock')">
          数据资产作价入股
        </div>
        <div class="menu-subitem" :class="{ active: activeTab === 'finance-other' }" @click="$emit('switch-tab', 'finance-other')">
          其他数据类融资
        </div>
        <div class="menu-item" :class="{ active: activeTab === 'reports' }" @click="$emit('switch-tab', 'reports')">
          报告管理
        </div>
      </nav>
    </aside>

    <button v-if="isCollapsed" class="expand-btn" @click="$emit('toggle')">▶</button>
  </div>
</template>

<script>
export default {
  name: 'AdminSidebar',
  props: {
    isCollapsed: {
      type: Boolean,
      required: true,
    },
    activeTab: {
      type: String,
      required: true,
    },
  },
  emits: ['toggle', 'switch-tab']
};
</script>

<style scoped>
.sidebar {
  width: 240px;
  height: 100vh;
  background-color: #2e3968;
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: relative;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 0;
  padding: 0;
  overflow: hidden;
  border-right: none;
}

.expand-btn {
  position: absolute;
  left: 0;
  top: 15px;
  z-index: 1000;
  background-color: #2e3968;
  color: white;
  border: 1px solid white;
  border-left: none;
  padding: 10px 8px;
  cursor: pointer;
  border-radius: 0 5px 5px 0;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.collapse-btn {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  margin-left: auto;
}

.sidebar-title {
  font-size: 20px;
  font-weight: bold;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
}

.menu {
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  overflow-y: auto;
}

.menu-item {
  padding: 12px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
}

.menu-item:hover {
  background-color: #2e3968;
}

.menu-item.active {
  background-color: white;
  color: #2e3968;
  font-weight: bold;
}

.menu-subitem {
  padding: 8px 15px 8px 30px;
  font-size: 13px;
  color: #eee;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  border-radius: 4px;
}

.menu-subitem:hover {
  background-color: #2e3968;
}

.menu-subitem.active {
  background-color: white;
  color: #2e3968;
  font-weight: bold;
}
</style>