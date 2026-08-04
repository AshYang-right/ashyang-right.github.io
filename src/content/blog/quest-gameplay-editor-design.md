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

第三幕是整段演出最经典的部分。Dutch 说出“Follow my lead”之后，帮派成员鱼贯而出，看似不经意地逐渐排开，却恰好在队伍中留出了一个属于玩家的位置。玩家只要顺势跟上，队形便会自然组合成标准的“英雄好汉背影”构图，一群人共同朝布雷斯维特庄园进发。

<div class="article-image-pair">
  <figure>
    <img src="/images/quest-gameplay-editor-design/task-3-hero-lineup-original.webp" alt="《荒野大镖客 2》中玩家走入帮派成员预留的位置，一行人的背影共同朝布雷斯维特庄园前进" loading="lazy" decoding="async" />
  </figure>
  <figure>
    <img src="/images/quest-gameplay-editor-design/task-3-hero-lineup-recreation.webp" alt="复现画面中多名角色排开组成英雄背影构图，共同面向远处的庄园" loading="lazy" decoding="async" />
  </figure>
</div>

音乐也在此时响起，镜头随之进入“英雄背影”的运镜，队形、构图和音乐共同把气氛推向高潮。最精彩的是，整个过程并不是一段夺走控制权的过场动画：玩家始终可以自由操控，却会受到现场氛围的感染，自然而然地走进预留位置，主动配合关卡设计师完成这幅画面。

这正是这段设计最好的地方——它没有命令玩家成为镜头里的演员，而是让玩家自己愿意成为其中的一员。

> **PS：个人偏好**
>
> 如果由我来设计，我可能会让角色的站位再错落一些，避免队列显得过于刻意；同时让 Dutch 走在稍微靠前的位置，用距离关系进一步表现他的领袖姿态。机位上，我也会尝试加入一点轻微的俯角。原作这种“背影 + 略微仰角”的组合，从摄影表达上更接近悲壮和英雄化的情绪；这里只是我个人在构图与人物表达上的取向。

#### 实现设计

要让这幅构图在玩家自由操作的情况下稳定出现，主要需要处理两个问题。

1. **队列**

   每名 NPC 都要先移动到预先分配的队列站位，但他们距离目标点的远近不同。如果所有人始终使用同一种速度，就无法在合适的时间组成队形。因此，距离较远的成员会短暂小跑，赶上预定的 Pose 和队列；距离较近的成员则可以正常行走。编辑器需要为每个角色配置目标站位和期望到达时间，再由运行时根据剩余距离选择合适的移动速度。

   这里不仅是逻辑问题，也依赖动画资源。步行、小跑、停步以及速度之间的过渡做得越完整，赶位过程就越自然；具体投入多少资源，需要各个项目根据演出标准和制作成本决定。

2. **速度**

   主角的速度由玩家控制，系统不能为了配合演出而突然加速或减速，否则会直接破坏操作手感。更合适的做法是只调整 NPC：当所有成员到达预定的队列成型点后，他们主动放慢速度，给玩家留出追上并补进队列的时间。

   当玩家进入预留位置、队形真正完整的一瞬间，再统一触发“英雄背影”运镜，同时让 BGM 进入高潮、切入氛围音乐中的女高音声部。队列、镜头和音乐由同一个成型事件同步启动，这个经典画面才会自然诞生。
