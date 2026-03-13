import { Card, ColumnId, Priority } from '../types';

let idCounter = 0;

function createId(): string {
  idCounter += 1;
  return `card-${idCounter}-${Date.now()}`;
}

interface SeedItem {
  title: string;
  description: string;
  tags: string[];
  priority: Priority;
  columnId: ColumnId;
}

const seedData: SeedItem[] = [
  {
    title: '设置项目脚手架',
    description: '使用 Vite + React + TypeScript 初始化项目',
    tags: ['setup', 'infra'],
    priority: 'high',
    columnId: 'done',
  },
  {
    title: '设计数据库 Schema',
    description: '定义用户表、任务表、标签表的关系',
    tags: ['backend', 'database'],
    priority: 'high',
    columnId: 'done',
  },
  {
    title: '实现用户认证',
    description: '接入 OAuth 2.0，支持 GitHub 登录',
    tags: ['backend', 'auth'],
    priority: 'high',
    columnId: 'in-progress',
  },
  {
    title: '看板拖拽功能',
    description: '支持卡片在列之间拖拽移动',
    tags: ['frontend', 'feature'],
    priority: 'high',
    columnId: 'in-progress',
  },
  {
    title: '卡片筛选功能',
    description: '按标签和优先级筛选卡片',
    tags: ['frontend', 'feature'],
    priority: 'medium',
    columnId: 'in-progress',
  },
  {
    title: '编写 API 文档',
    description: '使用 Swagger 文档化所有 REST 接口',
    tags: ['backend', 'docs'],
    priority: 'low',
    columnId: 'todo',
  },
  {
    title: '添加暗色模式',
    description: '实现主题切换，支持亮色/暗色两种模式',
    tags: ['frontend', 'ui'],
    priority: 'low',
    columnId: 'todo',
  },
  {
    title: '性能优化',
    description: '大列表虚拟滚动、组件懒加载、代码分割',
    tags: ['frontend', 'performance'],
    priority: 'medium',
    columnId: 'todo',
  },
  {
    title: '单元测试覆盖',
    description: '核心模块测试覆盖率达到 80%',
    tags: ['testing'],
    priority: 'medium',
    columnId: 'todo',
  },
  {
    title: 'CI/CD 流水线',
    description: '配置 GitHub Actions，自动测试和部署',
    tags: ['infra', 'devops'],
    priority: 'medium',
    columnId: 'todo',
  },
  {
    title: '国际化支持',
    description: '接入 i18n 框架，支持中英文切换',
    tags: ['frontend', 'feature'],
    priority: 'low',
    columnId: 'todo',
  },
  {
    title: '错误监控集成',
    description: '接入 Sentry，捕获前端和后端异常',
    tags: ['infra', 'monitoring'],
    priority: 'high',
    columnId: 'todo',
  },
];

export function generateSeedCards(): Card[] {
  return seedData.map((item, index) => ({
    id: createId(),
    title: item.title,
    description: item.description,
    tags: item.tags,
    priority: item.priority,
    columnId: item.columnId,
    createdAt: Date.now() - (seedData.length - index) * 60000,
    order: index,
  }));
}
