---
title: "让 NPC 跟随得更自然（上）：第三人称 RPG 的跟随行为设计"
description: "研究玩家作为被跟随方时，第三人称 RPG 如何通过站位、反应延迟与运动控制改善 NPC 的跟随表现。"
publishedAt: 2026-06-11
tags:
  - NPC
  - 游戏开发
  - 行为树
  - 技术策划
slug: natural-follow-behavior-design
featured: false
draft: false
---

跟随和被跟随在 RPG 中出现得非常频繁：玩家可能要跟着 NPC 前往某个地点交付任务，也可能在探索、护送或同行过程中，由 NPC 一路跟着玩家行动。这是一个会被反复看到的细节，但在我的体验里，目前大多数 RPG 并没有很好地打磨它。



<figure class="article-video">
  <video controls playsinline preload="metadata">
    <source src="/videos/genshin-npc-follow-player.mp4" type="video/mp4" />
    你的浏览器不支持视频播放。
  </video>
  <figcaption>《原神》任务中 NPC 跟随玩家的表现：功能上能够跟上，但起停、转向和站位仍然容易显得生硬。</figcaption>
</figure>

许多跟随功能虽然能让 NPC 跟上目标，但表现常常比较生硬：起停像在执行指令，转弯和追赶缺少过渡，距离和站位也不够稳定。调高移动速度或缩短跟随距离并不能解决这些问题。因为玩家何时起步、加速、转向或停止都无法预知，系统能控制的只有 NPC 如何回应。
这是系列的上篇，只讨论 NPC 跟随玩家的情况。当玩家成为跟随方时，设计目标会从“维持自然站位”转变为“让 NPC 提供清晰、可追踪的引导”，那部分留到下篇。



## 1. 设计概览：一个会呼吸的扇形

我想要的跟随更像放风筝：玩家始终牵着线，但 NPC 有自己的滑翔。NPC 的目标位于一个**会随运动状态变形的扇形区域**内：走得慢，待在侧后方；玩家突然跑起来，NPC 先愣一下再追，位置被拉向正后方；玩家停下，再慢慢踱回侧后方。


<div class="article-image-pair">
  <figure>
    <img src="/images/natural-follow-behavior-design/clumsy-follow-machine.png" alt="NPC 驾驶只有速度和距离旋钮的跟随机器，虽然跟得上玩家，动作却仍然生硬" loading="lazy" decoding="async" />
    <figcaption>机械式跟随：功能上跟得上，表现上却仍然生硬。</figcaption>
  </figure>
  <figure>
    <img src="/images/natural-follow-behavior-design/graceful-kite-follow.png" alt="玩家牵着风筝前行，NPC 小黑固定在风筝上自然滑行" loading="lazy" decoding="async" />
    <figcaption>理想跟随：像放风筝一样保持联系，同时自然、流畅、优雅。</figcaption>
  </figure>
</div>




## 2. 站位：保持距离和扇形模型

### 2.1 静止或低速移动时，待在侧后方

跟随站位和摄像机位置有很大关系。在第三人称越肩视角中，玩家既要看清前方，也要能随时确认跟随自己的 NPC 在哪里。NPC 如果长期位于玩家前方或身侧过近，容易遮挡主要视野；如果始终落在正后方，又常被玩家角色自身挡住，想确认它的位置就要大幅转动镜头。

因此在玩家静止或低速移动时，我把侧后方作为默认站位。它避开了镜头的主要观察方向，不会持续挡住玩家看路；同时又离当前取景范围不远，玩家需要寻找 NPC 时，只要小幅转动镜头就能看到。在玩家局部坐标系中，这片区域位于第三、第四象限，也就是左后方或右后方。NPC 在这里缓速跟进，与玩家保持近似稳定的相对位置。

<div class="article-image-pair">
  <figure>
    <img src="/images/natural-follow-behavior-design/camera-side-rear-position.png" alt="第三人称越肩视角中，玩家前方的橙色区域是主要视野，NPC 小黑位于侧后方，不遮挡前方观察，玩家只需小幅转动镜头即可看到它" loading="lazy" decoding="async" />
    <figcaption>侧后方避开主要视野，又能通过小幅转镜头迅速找到。</figcaption>
  </figure>
  <figure>
    <img src="/images/natural-follow-behavior-design/social-distance-contrast.png" alt="左侧 NPC 小黑和玩家勾肩搭背，距离过近；右侧小黑像保镖一样站在玩家侧后方，与玩家保持合适的社交距离" loading="lazy" decoding="async" />
    <figcaption>跟随不是贴身：NPC 与玩家保持社交距离，默认站在侧后方。</figcaption>
  </figure>
</div>

### 2.2 动态运动中，扇形会“呼吸”

玩家突然加速跑起来时，NPC 因为反应延迟会短暂落后，相对位置被拉向中轴；进入追赶后，理想站位也主动向中轴收拢——收成一条缝的扇形让 NPC 可以走直线、跑得快。玩家减速停下后，理想站位再重新展开回侧后方。

这些随运动状态连续变化的理想站位，在玩家身后共同形成一个扇形。

<figure>
  <img src="/images/natural-follow-behavior-design/03-breathing-fan-model.png" alt="玩家面朝上方时，NPC 小黑在身后的扇形区域内移动；低速时位于最小与最大距离之间，追赶时靠近中轴和最大距离，静止时回到侧后方的最小距离" loading="lazy" decoding="async" />
  <figcaption>会“呼吸”的扇形：低速位于侧后方，追赶时收向中轴和远端，静止后再回到侧后方近端。</figcaption>
</figure>

距离也会随状态变化。静止时靠近 `Min`，低速移动时位于 `Min` 和 `Max` 之间，高速追赶时再向 `Max` 拉开。

扇形描述所有运动状态下的理想站位集合。


## 3. 时序：玩家先动，NPC 稍后响应

### 3.1 反应延迟：跟随的“人味”来源

玩家在起步的同一帧就被跟上，看起来会很机灵，但也很不像人。我选择让 NPC 先观察、再响应：玩家先动，NPC 经过一段反应延迟 `τ` 后再跟上。这个延迟模拟的是 NPC 注意到玩家状态变化、再作出反应的过程。

延迟不只用于起步，玩家速度、方向和朝向的变化也应稍后传给 NPC。日式 RPG 常见的“蜈蚣式跟随”让队员复现领队路径，转弯时像一列火车。我的做法是让 NPC 根据延迟后的玩家状态和自身位置**重新计算目标**，而非复现路径。研究也表明，相比精确复现路径，朝向被跟随者当前方向移动的机器人更自然。[Natural Person-Following Behavior for Social Robots](https://www.ri.cmu.edu/pub_files/pub4/gockley_rachel_2007_1/gockley_rachel_2007_1.pdf)

一项直线行人跟随实验显示，领路者改变速度后，跟随者加速度变化的平均延迟约为 `420ms`。这可作为“玩家先动、NPC 后响应”的现实参照，但不能直接照搬进游戏。`τ` 仍需根据角色响应感、移动速度和动画节奏调整。[行人跟随中的速度视觉控制研究](https://pmc.ncbi.nlm.nih.gov/articles/PMC3919103/) `τ` 越长，NPC 越从容，也越容易掉队；距离失控时，实时安全通道会立即触发追赶。

<figure>
  <img src="/images/natural-follow-behavior-design/04-reaction-delay-curve.png" alt="玩家速度先上升，NPC 速度经过反应延迟后才开始上升，并在追赶阶段短暂超过玩家速度，最后比玩家更晚收敛到零" loading="lazy" decoding="async" />
  <figcaption>反应延迟不是停顿：NPC 晚 `τ` 起步，随后通过追赶追回距离，并在玩家停止后平滑收敛。</figcaption>
</figure>

工程上有三个容易混淆的时间概念。它们不能简单相加，否则 NPC 会等得太久：

- **移动确认时间**：判断玩家是正式移动，还是只碰了一下摇杆，也是第 5 节 `React` 状态的进入条件；
- **状态采样间隔**：系统多久记录一次玩家状态，纯属实现频率；
- **反应延迟 `τ`**：玩家状态确认变化后，NPC 在表现上晚多久响应，本文讨论的“延迟”都指它。

### 3.2 超出边界后追赶

偶尔有常见边界情况，例如玩家突然释放了位移技能。
所以系统同时维护两条通道：

- **延迟快照**：玩家的位置、移动方向、移动速度、转向状态，经过延迟后驱动普通跟随；
- **实时通道**：只用玩家当前的真实位置检查双方距离，一旦超过 `Max` 或距离失控，立刻触发追赶；除此之外不参与普通跟随。

普通情况下，NPC 仍会晚一步响应；距离超过 `Max` 时，实时通道会直接切入追赶，不再等待延迟。

## 4. 运动：从站位目标到连续移动

### 4.1 转弯时，不要照着玩家的路线走

玩家一转弯，跟随最容易露馅。如果 NPC 完整复现玩家走过的路线，无论转多大的弯都会跟着绕，几个人排在一起就像一列火车。可如果 NPC 始终守在玩家的同一侧，遇到掉头又容易多走一大圈。

我的处理是让 NPC 在玩家转弯后重新选择站位。小幅转向时，它通常留在原侧，沿外弧跟过去；大幅转向时，如果从内侧切过去更近，就允许它换到另一侧。为了避免在玩家身后左右摇摆，只有新路线明显更短时才换侧。

NPC 每次转弯后都重新选择站位，不去复现玩家刚才走过的路线。

<figure>
  <img src="/images/natural-follow-behavior-design/turn-path-choice.png" alt="玩家小幅转弯时，NPC 小黑保留原侧并沿较大的外弧跟随；玩家大幅转弯时，NPC 从转弯内侧切入，换到新扇形的另一侧并走出较短弧线" loading="lazy" decoding="async" />
  <figcaption>转弯后的目标重选：小幅转弯通常保留原侧、沿外弧跟随；大幅转弯时若内切明显更短，NPC 可以换边走小弯。</figcaption>
</figure>

### 4.2 起步和停步，不要直接改变速度

这部分在 3C 设计中已经很成熟：不要在状态变化时直接设置 NPC 的速度，而是持续设置加速度或移动输入，让它自然起步、刹车和转向。这里不再展开具体算法。

玩家急停时，小幅追过头甚至可以成为一段有用的表演。NPC 刹车不及，从玩家身侧跑到镜头前方，再停下转身。玩家此时很可能正准备和 NPC 交互，它也正好进入视野。

<figure>
  <img src="/images/natural-follow-behavior-design/npc-braking-overshoot.png" alt="玩家突然停下，小黑刹车不及，从侧后方冲进玩家前方的视野" loading="lazy" decoding="async" />
  <figcaption>玩家急停时，小黑刹车不及，顺势冲进玩家视野。</figcaption>
</figure>

一次小幅过冲可以保留，反复折返则要避免。速度和加速度仍需设上限，也要给 NPC 留出足够的减速空间。[Time-delayed Follow-the-Leader model](https://www.aimsciences.org/article/doi/10.3934/nhm.2015.10.579)

## 5. 整合：跟随状态机

状态机负责切换 NPC 的跟随意图，具体怎么起步、转弯和停下，仍由第 4 节的平滑运动处理。

<figure>
  <img src="/images/natural-follow-behavior-design/05-follow-state-machine.svg" alt="NPC 跟随状态机：Idle 经 React 进入 Follow；距离过远时进入 CatchUp，玩家停止时进入 Settle；任意状态发生异常时进入 Recover，恢复后返回 Follow" loading="lazy" decoding="async" />
  <figcaption>跟随状态机：主流程保持简单，追赶和异常恢复从普通跟随中分支处理。</figcaption>
</figure>

## 小结

本文采用的方案如下：

| 决策点 | 备选方案 | 本文选择 | 理由 |
| --- | --- | --- | --- |
| 跟随策略 | 复现玩家路径（蜈蚣式） | 目标重算 | 转向自然，有文献支持 |
| 响应时机 | 即时响应 | 反应延迟 + 实时安全通道 | 从容感与掉队恢复兼得 |
| 速度执行 | 直接设置速度 | 加速度收敛 | 无速度跳变，对动画系统友好 |
| 站位约束 | 固定点、固定侧 | 动态扇形 | 随速度变形，转向可顺势换侧 |


下篇将换一个方向：当玩家成为跟随方时，设计目标会从“维持自然站位”转变为“让 NPC 提供清晰、可追踪的引导”，届时再讨论领队 NPC 的行为设计。
