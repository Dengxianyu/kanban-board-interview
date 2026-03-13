---
name: score-bug-fix
description: 评估候选人 Bug 修复的得分（简单题，满分 40 分）
---

# 评分流程

1. 运行 e2e 测试：`pnpm test:e2e`
2. 分析测试结果
3. 检查代码改动范围：`git diff main..HEAD --stat`
4. 检查代码质量

## 评分维度

### 测试通过率（16 分）
- 核心测试（Test 1-5）：每个 2 分，共 10 分
- 辅助测试（Test 6-10）：每个 1.2 分，共 6 分

### Bug 定位准确性（8 分）
- 同时找到两个 bug（useLocalStorage 闭包 + moveCard 非 functional setState）= 8 分
- 只找到一个 = 4 分
- 没找到根本原因 = 0 分

### 修复质量（8 分）
- useLocalStorage：使用 ref 保持最新引用，beforeunload 和 cleanup 都读 ref = 4 分
- moveCard：使用 functional setState `setCards(prev => ...)` = 4 分
- 暴力修复（去掉 debounce / 重写整个模块）= 每项 1 分

### 改动范围（4 分）
- 只改了相关的 2-3 个文件 = 4 分
- 改动较多但合理 = 2 分
- 大面积重写 = 0 分

### 代码规范（4 分）
- 遵循项目现有 hooks 模式 = 2 分
- 无 TypeScript 类型错误 = 1 分
- 无新增 console.log/warn = 1 分

## 评级标准（40 分制）

- A（36-40）：优秀 - 精准定位两个 bug，修复质量高
- B（28-35）：良好 - 找到主要问题，修复基本正确
- C（20-27）：及格 - 部分修复，可能引入新问题
- D（0-19）：不及格 - 未能有效修复问题
