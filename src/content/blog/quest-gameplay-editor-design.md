---
title: "（文章持续施工中....）经典复刻（一）荒野大镖客2 古恨今愁 Blood Feuds, Ancient and Modern"
description: "游戏任务中的复杂演出需要同时编排角色、动画、对话与触发流程。本文从一次关卡复现出发，讨论为什么我们需要更完善的任务/玩法编辑器。"
publishedAt: 2026-08-04
tags:
  - 游戏开发
  - 编辑器
  - 任务设计
  - 技术策划
slug: quest-gameplay-editor-design
featured: false
draft: false
---

在游戏任务中，我们经常需要安排一连串演出：角色在合适的时间出现，走到指定位置，播放动画、说出台词，再根据玩家的行为进入下一段流程。单个动作并不复杂，但当它们被组合成一段完整表演后，流程很快就会变得难以编排和调整。

下面是《荒野大镖客 2》任务“古恨今愁”中的原版演出：

<figure class="article-video">
  <video controls playsinline preload="metadata">
    <source src="/videos/quest-gameplay-editor-design/rdr2-original.mp4" type="video/mp4" />
    你的浏览器不支持视频播放。
  </video>
  <figcaption>《荒野大镖客 2》“古恨今愁”原版演出。</figcaption>
</figure>

我在 Godot 中使用任务编辑器对白盒关卡进行了复现：

<figure class="article-video">
  <video controls playsinline preload="metadata">
    <source src="/videos/quest-gameplay-editor-design/godot-editor-recreation.mp4" type="video/mp4" />
    你的浏览器不支持视频播放。
  </video>
  <figcaption>使用 Godot 任务编辑器完成的白盒复现。</figcaption>
</figure>

这个 Demo 前后做了约 2 小时，主角也由我全程手动控制。由于这是我第一次使用 Godot，手头也没有多少可用的资产和素材，最终效果会比较粗糙，还请各位观众老爷见谅。

之所以选择这段演出，一是因为它足够经典，二是因为包含的要素很丰富。整个片段同时涉及多 NPC 走位、相机动画、台词、互动音乐和队形变化，是一个非常典型的演出关卡场景，很适合用来解释编辑器为什么要这样设计，并直观演示工具怎样承载一整段任务演出。

## 先把这段演出拆开

这段演出看起来是一条连续的流程，但从任务结构上看，可以拆成三个依次推进的子任务：

1. 移动到 Dutch 处，与 Dutch 汇合。
2. 和 Dutch 以及其他帮派成员对话。
3. 和帮派成员一起前往布雷斯维特庄园。

接下来，每个子任务只分成两部分：先分析这一段的整体设计，把亮点和可以优化的地方放在一起；然后再讨论这些效果如何通过任务编辑器实现。

### 任务一：移动到 Dutch 处，与 Dutch 汇合

<div class="article-image-pair">
  <figure>
    <img src="/images/quest-gameplay-editor-design/task-1-visual-guidance-01.png" alt="玩家从马的左侧下马后，右侧马匹形成前景遮挡，画面中心的唯一暖光成为视觉焦点并指向自然行进方向" loading="lazy" decoding="async" />
  </figure>
  <figure>
    <img src="/images/quest-gameplay-editor-design/task-1-visual-guidance-02.png" alt="道路左右两侧的马匹组成隐形护栏，左侧帮派成员向 Dutch 移动，大门灯光与道路构图共同收束玩家视线" loading="lazy" decoding="async" />
  </figure>
</div>

#### 设计分析

玩家从马的左侧下马时，右侧马匹形成前景遮挡，画面中心唯一的暖光自然成为视觉焦点。继续前进后，左右两侧的马匹又把空旷场景收束成一条通道，左侧帮派成员朝 Dutch 靠近的动线则进一步确认了终点。整个过程几乎不依赖文字，也能让玩家找到方向。可以优化的是大门灯光：让靠近帮派成员一侧的灯轻微忽明忽暗，既能加强引导，也能暗示范德林德帮的到来让布雷斯维特家族的前途变得不再明朗。

#### 实现设计

<!-- TODO：补充任务一对应的编辑器特性与实现。 -->

### 任务二：和 Dutch、其他帮派成员对话

#### 设计分析

第二幕只有在玩家靠近任务点后才会开始，但它的触发范围设置得很大。玩家刚走到视线能够落在 Dutch 身上的位置，Dutch 就已经开始移动，不需要玩家先精准踩到某个点位再等待演出启动，因此第一幕到第二幕的衔接非常自然。

这时，相机向右前方让出一步，并持续对准 Dutch。玩家被放到画面最左侧，画面中心则留给 Dutch 和其他帮派成员。Dutch 只说了一句“Follow my lead”，任务便进入第三幕；但正是这段很短的镜头变化，把视觉重心从玩家自然交给了即将带队行动的 Dutch，没有明显的镜头切换，也没有夺走玩家的沉浸感。

<figure>
  <img src="/images/quest-gameplay-editor-design/task-2-camera-shift.webp" alt="玩家靠近 Dutch 后，相机向右前方侧摇并持续追踪 Dutch，将玩家移到画面左侧，把视觉重心交给帮派成员" loading="lazy" decoding="async" />
</figure>

#### 实现设计

这一段需要同时编排触发范围、角色动画和相机运动。玩家进入较大的触发区域后，Dutch 的移动、台词和镜头动画便可以同时开始。对于相机，编辑器至少需要提供三个可以组合的属性：

1. **绑定对象**：相机仍然绑定在玩家身上，摇臂的另一端始终连接玩家。
2. **运动轨迹**：相机通过一次向右前方的弧形侧摇移动到玩家侧面，把玩家放到画面左侧，并为 Dutch 和其他成员让出中心构图。
3. **追踪朝向**：运动过程中启用 Look At，让镜头始终朝向 Dutch；当 Dutch 的表演结束后，再平滑切回以玩家为中心的默认镜头控制。

<figure>
  <img src="/images/quest-gameplay-editor-design/task-2-camera-interpolation-offset.png" alt="相机绑定玩家后，使用相对玩家的 Offset 插值移动到右后侧，并在运动过程中持续 Look At Dutch" loading="lazy" decoding="async" />
</figure>

相机应该采用数据化配置。位置参数描述相机相对于玩家的 Offset；设计师在相机动画工具中调整好运镜轨迹后，可以将这条轨迹导出为可插值的数据并存储。运行时只需要按时间读取和插值这些数据，再与绑定对象、Look At 目标组合，就能还原同一段镜头运动。

### 任务三：和帮派成员一起前往布雷斯维特庄园

#### 设计分析

<!-- TODO：补充任务三的设计分析。 -->

#### 实现设计

<!-- TODO：补充任务三对应的编辑器特性与实现。 -->
