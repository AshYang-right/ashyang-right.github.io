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

<!-- TODO：补充任务二的设计分析。 -->

#### 实现设计

<!-- TODO：补充任务二对应的编辑器特性与实现。 -->

### 任务三：和帮派成员一起前往布雷斯维特庄园

#### 设计分析

<!-- TODO：补充任务三的设计分析。 -->

#### 实现设计

<!-- TODO：补充任务三对应的编辑器特性与实现。 -->
