# Segment 06 首尾帧设计（权威角色版）

## 统一画面

- 画幅：横向 16:9。
- 场景：暖色图书馆木桌，背景书架虚化，柔和自然光，浅景深。
- 角色顺序：咕咕嘎嘎固定在左侧，DORO（粉粉）固定在右侧。
- 服装：沿用原忍者对决服装。咕咕嘎嘎为白色短忍者外套、橙红火焰袖口；DORO 为黑色短斗篷、红色滚边、红色云朵徽纹。
- 角色身份：脸部、手部、脚部、体型以官方三视图为准；服装与本段剧情服装保持不变。

## 首帧

文件：`start-frame-v3-original-costume-authoritative.png`

咕咕嘎嘎双脚站稳、双臂抬起，处于准备冲刺姿态；DORO 一手握银色三角飞镖，身体微侧防守。桌面前景保留三枚飞镖，作为动作方向提示。

## 尾帧

文件：`end-frame-v3-original-costume-authoritative.png`

咕咕嘎嘎向右前方跨出半步并前倾压迫，火焰袖向后摆；DORO 向右后方退半步，斗篷掀起，飞镖刀尖朝下。两人没有碰撞和受伤，保持互相对视，形成清晰的“逼近—后退”姿态差异。

## 权威参考

`authoritative-turnaround-contact-sheet-doro-gugugaga.png` 由以下官方三视图拼成，仅用于生成时校准脸、手、脚和比例：

- `assets/characters/doro/turnaround/front.png`
- `assets/characters/doro/turnaround/side.png`
- `assets/characters/doro/turnaround/back.png`
- `assets/characters/gugugaga/turnaround/front.png`
- `assets/characters/gugugaga/turnaround/side.png`
- `assets/characters/gugugaga/turnaround/back.png`

## 连续性约束

生成视频时将本段首帧作为输入起点、尾帧作为目标终点；不得换装、换位、改变发型/蝴蝶结/发夹/巨型拉链领口、拉长身体或出现人类手指。动作只表现逼近、后退和衣摆/袖口的惯性，不发生命中。
