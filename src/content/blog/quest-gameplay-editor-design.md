---
title: "如何设计一个任务/玩法编辑器"
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

<!-- TODO：后续补充任务/玩法编辑器的设计思路。 -->
