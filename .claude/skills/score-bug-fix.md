---
name: score-bug-fix
description: 评估候选人 Bug 修复的得分（满分 100 分）
---

# 评分流程

1. 运行 e2e 测试：`pnpm test:e2e`
2. 分析测试结果
3. 检查代码改动范围：`git diff main..HEAD --stat`
4. 检查代码质量

## 评分维度

### 测试通过率（40 分）
- 核心测试（Test 1-5）：每个 5 分，共 25 分
- 辅助测试（Test 6-10）：每个 3 分，共 15 分

### Bug 定位准确性（20 分）
- 同时找到两个 bug（useLocalStorage 闭包 + moveCard 非 functional setState）= 20 分
- 只找到一个 = 10 分
- 没找到根本原因 = 0 分

### 修复质量（20 分）
- useLocalStorage：使用 ref 保持最新引用，beforeunload 和 cleanup 都读 ref = 10 分
- moveCard：使用 functional setState `setCards(prev => ...)` = 10 分
- 暴力修复（去掉 debounce / 重写整个模块）= 每项 3 分

### 改动范围（10 分）
- 只改了相关的 2-3 个文件 = 10 分
- 改动较多但合理 = 5 分
- 大面积重写 = 0 分

### 代码规范（10 分）
- 遵循项目现有 hooks 模式 = 5 分
- 无 TypeScript 类型错误 = 3 分
- 无新增 console.log/warn = 2 分

## 评级标准（100 分制）

- A（90-100）：强烈推荐 - 精准定位两个 bug，修复质量高，改动精准
- B（70-89）：推荐 - 找到主要问题，修复基本正确
- C（50-69）：待定 - 部分修复，可能引入新问题
- D（0-49）：不推荐 - 未能有效修复问题
