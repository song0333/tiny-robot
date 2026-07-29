# ModelSelector 设计与实现回溯

## 1. 文档目的

本文记录 `packages/chat/src/components/model-selector` 的设计目标、实现拆分、关键交互、踩坑过程和最终取舍，作为后续维护、重构和能力扩展时的回溯依据。

本文只描述当前业务级 `ModelSelector` 的真实实现，不把它包装成通用 primitive 设计文档。

## 2. 一页结论

当前 `ModelSelector` 的定位是：

- 面向 `chat` 包的业务组件，不是公共 primitive。
- 优先解决模型选择场景，而不是提前抽象成可复用弹层系统。
- 已支持搜索、分组、键盘导航、空态、禁用态、浮层定位、主题适配和滚动条样式。
- 内部实现借鉴了 `packages/components` 的弹层和主题处理方式，但没有引入整套可组合原子体系。

最终结构的核心原则只有三条：

1. `ModelSelector.vue` 只做编排，不堆叠所有状态逻辑。
2. 搜索、选择、高亮、浮层定位分别拆到独立 composable。
3. 主题和 Teleport 行为尽量对齐现有原子组件，不在业务组件里再发明一套局部机制。

## 3. 需求边界

本次实现的明确目标：

- 在 `chat` 包内提供一个可直接使用的模型选择器。
- 支持根据关键字搜索模型。
- 支持按 provider 或 group 分组展示。
- 支持键盘上下移动、回车选择、Esc 关闭。
- 支持禁用项、空态、当前选中态。
- 浮层位置稳定，不能出现明显首帧闪动和漂移。
- 主题外观与 `components` 现有原子组件保持一致。

本次刻意不做的事情：

- 不抽象成通用 `Select` / `Combobox` primitive。
- 不提供复杂插槽体系。
- 不支持异步远程搜索。
- 不支持多选。
- 不处理模型能力开关、供应商配置编辑等更重的业务能力。

结论很明确：这是一个“够用、可维护、可扩展”的业务组件，而不是新的底层 UI 系统。

## 4. 目录结构

当前目录：

```txt
packages/chat/src/components/model-selector
├─ index.ts
├─ ModelSelector.vue
├─ normalizeModelOptions.ts
├─ providerIconMap.ts
├─ types.ts
├─ components
│  ├─ ModelSelectorTrigger.vue
│  ├─ ModelSelectorPanel.vue
│  ├─ ModelSelectorGroup.vue
│  └─ ModelSelectorItem.vue
├─ composables
│  ├─ useFloatingDropdown.ts
│  ├─ useModelSelectorFilter.ts
│  ├─ useModelSelectorNavigation.ts
│  ├─ useModelSelectorState.ts
│  └─ useTeleportTarget.ts
└─ icons
   ├─ IconOpenai.vue
   ├─ IconClaude.vue
   ├─ IconDeepseek.vue
   ├─ IconGemini.vue
   ├─ IconBailian.vue
   ├─ IconModelscope.vue
   ├─ IconOpenrouter.vue
   ├─ IconOllama.vue
   └─ index.ts
```

样式文件：

```txt
packages/chat/src/styles/model-selector.css
```

## 5. 文件职责

### 5.1 编排层

[`ModelSelector.vue`](../src/components/model-selector/ModelSelector.vue)

职责：

- 接收 `models`、`modelValue`、`disabled`。
- 组合 `state/filter/navigation/floating` 四类能力。
- 管理打开、关闭、切换、选择后的收尾动作。
- 连接触发器、浮层容器和面板。

它不负责：

- 写过滤逻辑。
- 写键盘遍历逻辑。
- 写浮层定位细节。
- 写原始模型数据归一化规则。

### 5.2 触发器层

[`ModelSelectorTrigger.vue`](../src/components/model-selector/components/ModelSelectorTrigger.vue)

职责：

- 渲染当前模型标签和 provider 图标。
- 表达 `open / disabled` 状态。
- 通过按钮语义暴露基础可访问性属性。

它是纯展示组件，不持有业务状态。

### 5.3 面板层

[`ModelSelectorPanel.vue`](../src/components/model-selector/components/ModelSelectorPanel.vue)

职责：

- 渲染搜索框。
- 渲染空态。
- 渲染分组列表容器。
- 只透传 `query / hover / select` 事件。

它不做数据处理，只消费已经准备好的 `groups`、`selectedValue`、`highlightedId`。

### 5.4 分组层

[`ModelSelectorGroup.vue`](../src/components/model-selector/components/ModelSelectorGroup.vue)

职责：

- 渲染组标题。
- 渲染组内的模型项列表。
- 在视图层继续透传 `hover / select`。

### 5.5 选项层

[`ModelSelectorItem.vue`](../src/components/model-selector/components/ModelSelectorItem.vue)

职责：

- 渲染单个模型项。
- 表达选中、高亮、禁用状态。
- 只在可选状态下触发 `hover / select`。

### 5.6 数据归一化

[`normalizeModelOptions.ts`](../src/components/model-selector/normalizeModelOptions.ts)

职责：

- 将外部 `ModelOption` 统一转换为内部 `NormalizedModelOption`。
- 补齐 `label / group / groupLabel / disabled / searchText`。
- 将搜索命中的数据预先串接为 `searchText`，降低过滤阶段复杂度。

这里的关键取舍是：先归一化，再过滤和导航。这样后续逻辑都只处理一种稳定结构。

### 5.7 默认 provider 图标映射

[`providerIconMap.ts`](../src/components/model-selector/providerIconMap.ts)

职责：

- 提供内置 provider 图标映射。
- 在 `model.icon` 未显式传入时按 `providerId` 兜底。
- 兼容 `openai123` 这类前缀型 provider 标识。

当前内置图标组件位于：

[`icons`](../src/components/model-selector/icons/index.ts)

### 5.8 当前值与兜底选择

[`useModelSelectorState.ts`](../src/components/model-selector/composables/useModelSelectorState.ts)

职责：

- 提供 `normalizedOptions`。
- 根据 `modelValue` 推导当前选中项。
- 推导 `currentProvider` 和 `currentLabel`。
- 提供 `selectOption`。
- 在当前值无效或被禁用时自动回退到第一个可选模型。

这层把“当前选中状态”与“过滤显示状态”分开，避免互相污染。

### 5.9 搜索与分组

[`useModelSelectorFilter.ts`](../src/components/model-selector/composables/useModelSelectorFilter.ts)

职责：

- 管理搜索关键字 `query`。
- 输出过滤后的 `visibleOptions`。
- 基于过滤结果生成 `groups`。
- 输出 `isEmpty`。

这里没有引入模糊搜索库，只做简单稳定的 `includes` 匹配，符合当前需求边界。

### 5.10 键盘导航与高亮

[`useModelSelectorNavigation.ts`](../src/components/model-selector/composables/useModelSelectorNavigation.ts)

职责：

- 管理 `highlightedId`。
- 处理上下键循环移动。
- 处理回车选择和 Esc 关闭。
- 在打开时优先高亮当前选中项，否则高亮首个可选项。
- 在高亮变化时自动 `scrollIntoView`。

这层只关心“当前可见列表里的可交互项如何移动”，不关心浮层如何定位。

### 5.11 浮层定位

[`useFloatingDropdown.ts`](../src/components/model-selector/composables/useFloatingDropdown.ts)

职责：

- 管理 `isOpen` 和 `isPositioned`。
- 基于 `@floating-ui/dom` 计算浮层位置。
- 处理窗口变化、滚动、尺寸变化后的自动重算。
- 处理点击外部关闭。
- 在关闭后按需把焦点还给触发元素。

### 5.12 Teleport 目标

[`useTeleportTarget.ts`](../src/components/model-selector/composables/useTeleportTarget.ts)

职责：

- 决定浮层应该挂载到哪里。
- 默认对齐 `packages/components/src/shared/composables/useTeleportTarget.ts` 的查找策略。
- 在普通文档流和 Shadow DOM 下都能找到合理挂载点。

### 5.13 样式层

[`model-selector.css`](../src/styles/model-selector.css)

职责：

- 定义触发器、浮层、分组、选项、空态的外观。
- 消费全局主题 token。
- 定义滚动条样式。
- 定义浮层入场动画。

## 6. 数据结构设计

内部核心类型：

[`types.ts`](../src/components/model-selector/types.ts)

```ts
export interface NormalizedModelOption {
  id: string
  value: string
  label: string
  providerId?: string
  icon?: Component
  disabled: boolean
  group: string
  groupLabel: string
  keywords: string[]
  searchText: string
  raw: ModelOption
}
```

这样设计的目的：

- `id / value` 分离，便于未来保留内部稳定标识。
- `group / groupLabel` 提前固化，分组阶段不再重复推导。
- `searchText` 预处理后，搜索逻辑保持极简。
- `raw` 保留原始数据，选择时仍能向外抛出原始 `ModelOption`。

## 7. 核心交互流

### 7.1 打开流程

```txt
点击 Trigger
  -> handleToggle()
  -> handleOpen()
  -> clearQuery()
  -> open()
  -> highlightSelectedOrFirst()
  -> Teleport 渲染浮层
  -> nextTick 后计算定位
  -> isPositioned = true
```

### 7.2 搜索流程

```txt
输入关键字
  -> setQuery()
  -> normalizedQuery
  -> visibleOptions
  -> groups
  -> 面板重渲染
  -> navigation watch 校验高亮项是否仍存在
```

### 7.3 键盘流程

```txt
ArrowDown / ArrowUp
  -> moveHighlight()
  -> highlightedId 更新
  -> scrollIntoView()

Enter
  -> selectHighlighted()
  -> handleSelectOption()

Escape
  -> onClose()
  -> handleClose({ restoreFocus: true })
```

### 7.4 选择流程

```txt
点击选项 / 回车选中
  -> handleSelectOption()
  -> useModelSelectorState.selectOption()
  -> update:modelValue
  -> change(model)
  -> handleClose({ restoreFocus: true })
  -> clearQuery()
  -> resetHighlight()
```

## 8. 浮层定位方案

## 8.1 选型

当前使用 `@floating-ui/dom`，不是手写定位，也不是直接复用通用 Popper 组件。

原因：

- 当前只需要一个业务级下拉浮层，直接接入现成定位能力最快。
- `@floating-ui/dom` 只解决定位，不强绑完整交互模型。
- 比起先抽一个全局 primitive，再接业务选择器，当前路径更短。

## 8.2 当前中间件配置

定位配置在 [`useFloatingDropdown.ts`](../src/components/model-selector/composables/useFloatingDropdown.ts)：

```ts
placement: 'bottom-start'
strategy: 'fixed'
middleware: [
  offset(8),
  flip({ padding: 8 }),
  shift({ padding: 8 }),
  size({
    apply({ rects, elements }) {
      elements.floating.style.minWidth = `${Math.round(rects.reference.width)}px`
    },
  }),
]
```

含义：

- `bottom-start`：默认从触发器左下方弹出。
- `fixed`：避免受某些祖先布局影响。
- `offset(8)`：触发器与浮层保留 8px 间距。
- `flip`：底部空间不足时翻转。
- `shift`：避免浮层超出视口。
- `size`：保证最小宽度不小于触发器宽度。

## 8.3 早期问题与根因

早期版本出现两个典型问题：

1. 浮层不是从触发器位置稳定弹出。
2. 首帧会闪动、漂移。

根因不是单一问题，而是两个问题叠加：

- 浮层先渲染，再异步计算位置。
- 定位层和动画层共用同一个元素，`transform` 语义互相覆盖。

如果同一个元素既负责定位又负责入场动画，动画里的位移很容易干扰浮层库写入的位置。

## 8.4 最终修正

最终方案：

- 用 `Teleport` 把浮层挂到稳定容器。
- 用 `isPositioned` 控制定位完成前隐藏浮层。
- 把“定位层”和“动画层”拆成两层节点。

当前结构：

```txt
referenceEl
  -> Teleport
    -> dropdown-wrapper    // 定位层，left/top 由 floating-ui 写入
      -> dropdown-surface  // 动画层，只负责入场动画
        -> panel
```

这样处理后：

- 计算位置前浮层不可见，不会闪到左上角。
- 定位与动画解耦，不再互相抢 `transform`。
- `autoUpdate` 会在滚动、窗口尺寸变化、引用元素变化时自动跟随。

## 9. Teleport 和挂载点策略

`ModelSelector` 没有直接把浮层写死到 `document.body`，而是使用 [`useTeleportTarget.ts`](../src/components/model-selector/composables/useTeleportTarget.ts)。

原因：

- 与 `packages/components` 现有方案保持一致。
- 在 Shadow DOM 场景下，挂到当前 root 更安全。
- 避免业务组件自己维护一套额外主题同步逻辑。

最终策略：

- 优先使用显式 `target`。
- 否则根据 `referenceEl` 所在 root 决定搜索范围。
- 普通场景回退到 `document.body`。
- Shadow DOM 场景回退到当前 `rootNode`。

## 10. 主题适配方案

## 10.1 错误方向

早期尝试过在业务组件内手动补主题属性或局部主题同步。

这个方向的问题是：

- 会重复实现 `components` 已有的主题能力。
- Teleport 后的浮层容易和主题根节点脱节。
- 后续每个浮层类组件都要重复补一遍。

## 10.2 最终方案

最终方案是直接对齐 `components` 原子组件：

- 复用现有全局 CSS token。
- Teleport 目标策略对齐 `components`。
- 不在 `chat` 内部单独维护一套主题注入协议。

当前样式直接消费的 token 包括：

- `--tr-container-bg-default`
- `--tr-container-bg-hover`
- `--tr-border-color-default`
- `--tr-border-color-hover`
- `--tr-text-primary`
- `--tr-text-secondary`
- `--tr-text-tertiary`
- `--tr-text-disabled`
- `--tr-color-primary`
- `--tr-dropdown-menu-bg-color`
- `--tr-dropdown-menu-box-shadow`
- `--tr-dropdown-menu-item-color`
- `--tr-dropdown-menu-item-hover-bg-color`
- `--tr-z-index-dropdown`

结论：主题问题的正确解法不是“给业务组件补主题系统”，而是“让业务组件走进已有主题系统”。

## 11. 滚动条样式方案

模型列表滚动区域在 [`model-selector.css`](../src/styles/model-selector.css) 的 `.tr-model-selector__content`。

样式策略对齐了 `LayoutProxyScrollbar` 和 `DropdownMenu`：

- Firefox 使用 `scrollbar-width` 和 `scrollbar-color`。
- WebKit 使用 `::-webkit-scrollbar*` 系列伪元素。
- thumb 颜色优先复用 `layout` 的滚动条 token，没有时回退到 `dropdown-menu` 相关 token。

当前用到的变量：

- `--tr-layout-main-scrollbar-thumb-bg`
- `--tr-layout-main-scrollbar-thumb-bg-hover`
- `--tr-layout-main-scrollbar-thumb-bg-active`
- `--tr-dropdown-menu-scrollbar-thumb-color`

这样做的好处是：

- 外观与现有组件更一致。
- 不需要在 `chat` 自己维护一套滚动条颜色体系。

## 12. 搜索与分组设计

搜索和分组采用最简单的两段式处理：

```txt
models
  -> normalizeModelOptions()
  -> visibleOptions
  -> groups
```

这样拆分有三个好处：

1. 搜索阶段只处理平铺列表，逻辑简单。
2. 分组永远基于“过滤后的结果”，不会出现空组清理问题。
3. 键盘导航只依赖 `visibleOptions`，不必关心组嵌套结构。

当前搜索范围：

- `label`
- `value`
- `providerId`
- `group`
- `keywords`

当前分组策略：

- 优先用 `model.group`
- 否则用 `model.providerId`
- 再兜底到 `default`

这里没有做 group label 映射表，是有意为之。当前需求只需要清晰分组，不需要复杂展示语义。

## 13. 键盘导航设计

键盘导航集中在 [`useModelSelectorNavigation.ts`](../src/components/model-selector/composables/useModelSelectorNavigation.ts)。

当前规则：

- 只在弹层打开时响应按键。
- 只在可选项之间循环移动。
- 搜索结果变化后，如果当前高亮项消失，自动回到“当前选中项或首个可选项”。
- 高亮变化后自动把目标项滚动到可视区域。

这样做的目的不是做完整可访问性框架，而是保证：

- 搜索后仍可连续键盘操作。
- 禁用项不会被错误高亮。
- 当前选中项始终是打开后的默认关注点。

## 14. 状态兜底策略

[`useModelSelectorState.ts`](../src/components/model-selector/composables/useModelSelectorState.ts) 里有一个很关键但容易忽略的规则：

```txt
如果当前 modelValue 无效，或者对应模型已禁用
  -> 自动选择第一个可用模型
```

这样做是为了处理以下情况：

- 外部传入了已经下线的模型值。
- 当前模型列表动态变化。
- 默认值为空，但实际上列表里已有可用模型。

这保证了触发器文案和当前值状态不会长期处于悬空状态。

## 15. 为什么没有继续抽成通用 primitive

当前没有继续抽成通用 primitive，原因很直接：

- 当前只需要一个 `ModelSelector`。
- 搜索、分组、键盘导航、空态这些能力都高度贴合模型选择场景。
- 如果提前抽象 `Select + Popover + SearchList + OptionGroup`，会明显增加目录、协议和维护成本。

更重要的是，当前真实需求只是：

- 能搜索。
- 能分组。
- 弹层稳定。
- 主题一致。

在这个阶段继续抽象，只会把实现时间转移到设计和清理 API 上，而不会给交付带来实际收益。

## 16. 与 `packages/components` 的关系

当前实现不是直接复用 `components` 里的某个现成组合组件，但明确借鉴了它们的几项稳定做法：

- Teleport 挂载点策略。
- 全局主题 token 使用方式。
- 下拉类组件的阴影、边框、层级和滚动条风格。
- 浮层应尽量与触发器解耦、与主题系统对齐。

当前 `chat` 额外补了一层轻量的 provider 图标映射，用来覆盖默认模型展示，而不是要求外部所有模型数据都显式传入 `icon`。

可以理解为：

```txt
借鉴已验证的基础约束
+ 保留 chat 自己的业务结构
= 当前 ModelSelector
```

## 17. 当前实现的优点

- 复杂度控制在业务组件范围内，没有过度抽象。
- 目录拆分清晰，状态、过滤、导航、定位职责分离。
- 浮层定位已经解决首帧闪动和漂移问题。
- 主题和滚动条已对齐现有原子组件体系。
- 后续加 capability 标识、描述信息、图标扩展时，有明确落点。

## 18. 当前已知边界

当前实现仍然是单选模型选择器，因此不覆盖：

- 多选。
- 异步分页搜索。
- 复杂虚拟列表。
- 组选项折叠。
- 任意插槽定制。
- 通用可访问性 primitive 的完整语义补齐。

如果后续需求仍集中在模型选择场景，继续在当前结构上小步扩展即可。
如果后续要把整套选择类 primitive 统一迁移到另一套体系，再考虑抽更底层的协议。

## 19. 后续扩展建议

当前最合理的扩展顺序：

1. 在 `NormalizedModelOption` 增加描述信息或能力标签。
2. 在 `ModelSelectorItem.vue` 增加副标题或 capability 徽标。
3. 在 `ModelSelectorPanel.vue` 增加更明确的空态文案。
4. 如果后续出现第二个同类选择器，再评估是否抽取共享 primitive。

不建议现在就做的事情：

- 先抽一个大而全的通用选择器体系。
- 在 `chat` 包内复制一份 `components` 的主题或 Teleport 机制。
- 为假设中的未来场景提前设计可插拔协议。

## 20. 相关文件

- [ModelSelector.vue](../src/components/model-selector/ModelSelector.vue)
- [providerIconMap.ts](../src/components/model-selector/providerIconMap.ts)
- [ModelSelectorTrigger.vue](../src/components/model-selector/components/ModelSelectorTrigger.vue)
- [ModelSelectorPanel.vue](../src/components/model-selector/components/ModelSelectorPanel.vue)
- [useFloatingDropdown.ts](../src/components/model-selector/composables/useFloatingDropdown.ts)
- [useModelSelectorState.ts](../src/components/model-selector/composables/useModelSelectorState.ts)
- [useModelSelectorFilter.ts](../src/components/model-selector/composables/useModelSelectorFilter.ts)
- [useModelSelectorNavigation.ts](../src/components/model-selector/composables/useModelSelectorNavigation.ts)
- [useTeleportTarget.ts](../src/components/model-selector/composables/useTeleportTarget.ts)
- [model-selector.css](../src/styles/model-selector.css)
- `packages/components/src/shared/composables/useTeleportTarget.ts`
- `packages/components/src/layout/LayoutProxyScrollbar.vue`
