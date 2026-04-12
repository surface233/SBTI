# SBTI 业务逻辑与计算规则说明

## 1. 文档目的

本文档说明本项目的业务逻辑、答题流程、评分规则、人格匹配算法、隐藏人格规则，以及全部可展示人格结果。

当前实现是纯前端 rule-based scoring system：

- 不依赖后端 API
- 不依赖 Machine Learning
- 不上传用户答案
- 所有计算都在浏览器内完成

核心代码：

| 文件 | 作用 |
|---|---|
| `data.js` | 题库、人格文案、人格图片映射、人格 pattern |
| `app.js` | 答题流程、进度计算、隐藏题插入、结果计算、结果渲染 |
| `index.html` | 页面结构 |
| `styles.css` | 页面样式 |

## 2. 数据结构总览

| 数据项 | 数量 | 说明 |
|---|---:|---|
| 常规题 `QUESTIONS` | 30 | 用于计算 15 个维度 |
| 补充/隐藏题 `SPECIAL_QUESTIONS` | 2 | 用于触发 `DRUNK` 隐藏人格 |
| 维度 | 15 | 每个维度由 2 道常规题组成 |
| 常规匹配人格 `NORMAL_TYPES` | 25 | 参与 distance 匹配 |
| 可展示人格 `TYPE_LIBRARY` | 27 | 包含 25 常规人格、`HHHH`、`DRUNK` |
| 人格图片 `TYPE_IMAGES` | 27 | 每个可展示人格对应 1 张结果图 |

## 3. 业务流程

### 3.1 首页

用户进入页面后，首页只提供主要入口：

```text
开始测试
```

如果浏览器 `localStorage` 中存在上次答题状态，会显示：

```text
继续上次
```

### 3.2 开始测试

点击 `开始测试` 后：

1. 系统打乱 30 道常规题顺序
2. 随机生成一个插入位置 `gateIndex`
3. 在该位置插入第一道补充题 `drink_gate_q1`
4. 清空旧答案
5. 渲染答题页
6. 初始进度通常为 `0 / 31`

### 3.3 补充题分支

第一道补充题：

```text
drink_gate_q1: 您平时有什么爱好？
```

选项：

| 选项 | 文案 | value | 后续 |
|---|---|---:|---|
| A | 吃喝拉撒 | 1 | 不插入第二道隐藏题 |
| B | 艺术爱好 | 2 | 不插入第二道隐藏题 |
| C | 饮酒 | 3 | 插入 `drink_gate_q2` |
| D | 健身 | 4 | 不插入第二道隐藏题 |

如果用户选择 `饮酒`，系统会在它后面插入第二道隐藏题：

```text
drink_gate_q2: 您对饮酒的态度是？
```

此时总题数从：

```text
31
```

变为：

```text
32
```

### 3.4 提交条件

提交按钮只有在所有当前可见题目都完成后才会启用。

非饮酒路径：

```text
30 道常规题 + 1 道补充题 = 31 题
```

饮酒路径：

```text
30 道常规题 + 2 道补充/隐藏题 = 32 题
```

## 4. 维度体系

30 道常规题覆盖 15 个维度，每个维度 2 道题。

| 维度 | 中文名 | 所属模型 | 题目数量 | 分值范围 |
|---|---|---|---:|---|
| S1 | 自尊自信 | 自我模型 | 2 | 2-6 |
| S2 | 自我清晰度 | 自我模型 | 2 | 2-6 |
| S3 | 核心价值 | 自我模型 | 2 | 2-6 |
| E1 | 依恋安全感 | 情感模型 | 2 | 2-6 |
| E2 | 情感投入度 | 情感模型 | 2 | 2-6 |
| E3 | 边界与依赖 | 情感模型 | 2 | 2-6 |
| A1 | 世界观倾向 | 态度模型 | 2 | 2-6 |
| A2 | 规则与灵活度 | 态度模型 | 2 | 2-6 |
| A3 | 人生意义感 | 态度模型 | 2 | 2-6 |
| Ac1 | 动机导向 | 行动驱力模型 | 2 | 2-6 |
| Ac2 | 决策风格 | 行动驱力模型 | 2 | 2-6 |
| Ac3 | 执行模式 | 行动驱力模型 | 2 | 2-6 |
| So1 | 社交主动性 | 社交模型 | 2 | 2-6 |
| So2 | 人际边界感 | 社交模型 | 2 | 2-6 |
| So3 | 表达与真实度 | 社交模型 | 2 | 2-6 |

## 5. 单题与单维度计分

### 5.1 常规题分值

常规题每题 3 个选项，每个选项对应一个数字分值：

| 选项序号 | value |
|---|---:|
| A | 1 |
| B | 2 |
| C | 3 |

注意：不同题目的选项文案方向不一定相同，但数据层已经通过 `value` 表达它对维度高低的贡献。

### 5.2 单维度原始分

每个维度由 2 道题构成，因此：

```text
单维度最低分 = 1 + 1 = 2
单维度最高分 = 3 + 3 = 6
```

### 5.3 原始分转 level

系统不会直接拿原始分匹配人格，而是先把每个维度折算为 `L / M / H`。

| 原始分 | level | 业务含义 |
|---:|---|---|
| 2 | L | 偏低 |
| 3 | L | 偏低 |
| 4 | M | 中等 |
| 5 | H | 偏高 |
| 6 | H | 偏高 |

对应代码逻辑：

```js
function levelFromScore(score) {
  if (score <= 3) return "L";
  if (score === 4) return "M";
  return "H";
}
```

## 6. 用户人格向量

系统会按照固定维度顺序生成 15 位人格向量：

```text
S1, S2, S3, E1, E2, E3, A1, A2, A3, Ac1, Ac2, Ac3, So1, So2, So3
```

每一位都是：

```text
L / M / H
```

示例：

```text
HHH-HMH-MHH-HHH-MHM
```

这类 15 位字符串就是人格匹配的核心输入。

## 7. 常规人格匹配算法

### 7.1 常规人格 pattern

`NORMAL_TYPES` 中每个人格都有一个固定 pattern。

示例：

```text
CTRL = HHH-HMH-MHH-HHH-MHM
```

这个 pattern 表示该人格在 15 个维度上的理想画像。

### 7.2 level 数值化

匹配前，系统会把 level 转成数字：

| level | 数值 |
|---|---:|
| L | 1 |
| M | 2 |
| H | 3 |

### 7.3 distance 计算

用户向量和每个人格 pattern 逐维比较。

单维差值：

```text
diff = abs(userLevel - typeLevel)
```

总距离：

```text
distance = sum(diff[0..14])
```

`distance` 越小，说明用户向量越接近该人格。

### 7.4 exact 计算

系统还会统计完全一致的维度数量：

```text
exact = count(diff === 0)
```

`exact` 越高，说明命中的维度越多。

### 7.5 排序规则

所有常规人格计算完成后排序：

| 优先级 | 规则 |
|---:|---|
| 1 | `distance` 小者优先 |
| 2 | 如果 `distance` 相同，`exact` 大者优先 |
| 3 | 如果仍相同，保持 `NORMAL_TYPES` 中更靠前的类型 |

最终取排序后的第一名作为 `bestNormal`。

## 8. 匹配度计算

匹配度公式：

```text
similarity = round((1 - distance / 30) * 100)
```

最低值兜底：

```text
similarity = max(0, similarity)
```

为什么除以 `30`：

```text
15 个维度 * 单维最大差值 2 = 30
```

因此：

| distance | similarity |
|---:|---:|
| 0 | 100% |
| 5 | 83% |
| 10 | 67% |
| 12 | 60% |
| 15 | 50% |
| 30 | 0% |

## 9. 特殊结果规则

### 9.1 DRUNK 隐藏人格

如果用户满足以下路径：

```text
drink_gate_q1 选择“饮酒”
drink_gate_q2 选择“我习惯将白酒灌在保温杯，当白开水喝，酒精令我信服。”
```

也就是：

```text
state.answers["drink_gate_q2"] === 2
```

则直接展示：

```text
DRUNK（酒鬼）
```

此时：

| 字段 | 值 |
|---|---|
| type | `DRUNK` |
| similarity | `100` |
| exact | `15` |
| levels | 全部显示为 `M` |
| scores | 全部显示为 `4` |
| 是否进入常规匹配 | 否 |

### 9.2 HHHH 兜底人格

如果没有触发 `DRUNK`，系统会走常规匹配。

但如果最佳常规人格的匹配度低于：

```text
60%
```

则展示：

```text
HHHH（傻乐者）
```

业务含义：用户答案与现有 25 个常规人格 pattern 都不够接近，系统用 `HHHH` 作为兜底结果。

### 9.3 常规人格

如果没有触发 `DRUNK`，且最佳常规人格匹配度大于等于 `60%`，则展示 `bestNormal`。

## 10. 结果类型总表

### 10.1 常规匹配人格

下表中的 25 种人格会参与 distance 匹配。

| # | code | 中文名 | pattern | 图片 | 结果短句 |
|---:|---|---|---|---|---|
| 1 | CTRL | 拿捏者 | `HHH-HMH-MHH-HHH-MHM` | `assets/images/CTRL.png` | 怎么样，被我拿捏了吧？ |
| 2 | ATM-er | 送钱者 | `HHH-HHM-HHH-HMH-MHL` | `assets/images/ATM-er.png` | 你以为我很有钱吗？ |
| 3 | Dior-s | 屌丝 | `MHM-MMH-MHM-HMH-LHL` | `assets/images/Dior-s.jpg` | 等着我屌丝逆袭。 |
| 4 | BOSS | 领导者 | `HHH-HMH-MMH-HHH-LHL` | `assets/images/BOSS.png` | 方向盘给我，我来开。 |
| 5 | THAN-K | 感恩者 | `MHM-HMM-HHM-MMH-MHL` | `assets/images/THAN-K.png` | 我感谢苍天！我感谢大地！ |
| 6 | OH-NO | 哦不人 | `HHL-LMH-LHH-HHM-LHL` | `assets/images/OH-NO.png` | 哦不！我怎么会是这个人格？！ |
| 7 | GOGO | 行者 | `HHM-HMH-MMH-HHH-MHM` | `assets/images/GOGO.png` | gogogo~出发咯 |
| 8 | SEXY | 尤物 | `HMH-HHL-HMM-HMM-HLH` | `assets/images/SEXY.png` | 您就是天生的尤物！ |
| 9 | LOVE-R | 多情者 | `MLH-LHL-HLH-MLM-MLH` | `assets/images/LOVE-R.png` | 爱意太满，现实显得有点贫瘠。 |
| 10 | MUM | 妈妈 | `MMH-MHL-HMM-LMM-HLL` | `assets/images/MUM.png` | 或许...我可以叫你妈妈吗....? |
| 11 | FAKE | 伪人 | `HLM-MML-MLM-MLM-HLH` | `assets/images/FAKE.png` | 已经，没有人类了。 |
| 12 | OJBK | 无所谓人 | `MMH-MMM-HML-LMM-MML` | `assets/images/OJBK.png` | 我说随便，是真的随便。 |
| 13 | MALO | 吗喽 | `MLH-MHM-MLH-MLH-LMH` | `assets/images/MALO.png` | 人生是个副本，而我只是一只吗喽。 |
| 14 | JOKE-R | 小丑 | `LLH-LHL-LML-LLL-MLM` | `assets/images/JOKE-R.jpg` | 原来我们都是小丑。 |
| 15 | WOC! | 握草人 | `HHL-HMH-MMH-HHM-LHH` | `assets/images/WOC.png` | 卧槽，我怎么是这个人格？ |
| 16 | THIN-K | 思考者 | `HHL-HMH-MLH-MHM-LHH` | `assets/images/THIN-K.png` | 已深度思考100s。 |
| 17 | SHIT | 愤世者 | `HHL-HLH-LMM-HHM-LHH` | `assets/images/SHIT.png` | 这个世界，构石一坨。 |
| 18 | ZZZZ | 装死者 | `MHL-MLH-LML-MML-LHM` | `assets/images/ZZZZ.png` | 我没死，我只是在睡觉。 |
| 19 | POOR | 贫困者 | `HHL-MLH-LMH-HHH-LHL` | `assets/images/POOR.png` | 我穷，但我很专。 |
| 20 | MONK | 僧人 | `HHL-LLH-LLM-MML-LHM` | `assets/images/MONK.png` | 没有那种世俗的欲望。 |
| 21 | IMSB | 傻者 | `LLM-LMM-LLL-LLL-MLM` | `assets/images/IMSB.png` | 认真的么？我真的是傻逼么？ |
| 22 | SOLO | 孤儿 | `LML-LLH-LHL-LML-LHM` | `assets/images/SOLO.png` | 我哭了，我怎么会是孤儿？ |
| 23 | FUCK | 草者 | `MLL-LHL-LLM-MLL-HLH` | `assets/images/FUCK.png` | 操！这是什么人格？ |
| 24 | DEAD | 死者 | `LLL-LLM-LML-LLL-LHM` | `assets/images/DEAD.png` | 我，还活着吗？ |
| 25 | IMFW | 废物 | `LLH-LHL-LML-LLL-MLL` | `assets/images/IMFW.png` | 我真的...是废物吗？ |

### 10.2 特殊展示人格

这 2 种人格不参与常规 distance 排名，但可能成为最终结果。

| code | 中文名 | 类型 | 触发条件 | 图片 | 结果短句 |
|---|---|---|---|---|---|
| HHHH | 傻乐者 | 兜底人格 | 最佳常规人格 `similarity < 60%` | `assets/images/HHHH.png` | 哈哈哈哈哈哈。 |
| DRUNK | 酒鬼 | 隐藏人格 | 饮酒隐藏题命中：`drink_gate_q2 === 2` | `assets/images/DRUNK.png` | 烈酒烧喉，不得不醉。 |

## 11. 可展示结果数量

最终可展示人格共：

```text
25 个常规人格 + 1 个兜底人格 + 1 个隐藏人格 = 27 种
```

## 12. 组合数量

### 12.1 常规题组合

30 道常规题，每题 3 个选项：

```text
3^30 = 205,891,132,094,649
```

### 12.2 含补充题的答题路径组合

补充题有分支：

| 路径 | 补充题组合数 | 说明 |
|---|---:|---|
| 非饮酒 | 3 | `drink_gate_q1` 选择 A/B/D |
| 饮酒但不触发 DRUNK | 1 | `drink_gate_q1=C` 且 `drink_gate_q2=A` |
| 饮酒并触发 DRUNK | 1 | `drink_gate_q1=C` 且 `drink_gate_q2=B` |

因此补充分支总数：

```text
3 + 1 + 1 = 5
```

完整原始答题路径组合：

```text
3^30 * 5 = 1,029,455,660,473,245
```

### 12.3 维度 level 组合

每个维度有 `L / M / H` 三种 level，共 15 个维度：

```text
3^15 = 14,348,907
```

### 12.4 维度原始分组合

每个维度原始分有 `2 / 3 / 4 / 5 / 6` 五种，共 15 个维度：

```text
5^15 = 30,517,578,125
```

## 13. 伪代码

```text
开始测试:
  打乱 QUESTIONS
  随机生成 gateIndex
  插入 drink_gate_q1
  渲染题目

用户答题:
  记录 answers[questionId] = value
  如果 drink_gate_q1 == 3:
    插入 drink_gate_q2
  如果 drink_gate_q1 != 3:
    删除 drink_gate_q2 答案
  更新进度

提交:
  如果 drink_gate_q2 == 2:
    返回 DRUNK
  否则:
    计算 15 个维度 rawScores
    rawScores 转 levels
    userVector = 15 位 L/M/H
    遍历 25 个 NORMAL_TYPES:
      计算 distance
      计算 exact
      计算 similarity
    排序取 bestNormal
    如果 bestNormal.similarity < 60:
      返回 HHHH
    否则:
      返回 bestNormal
```

## 14. 业务规则总结

| 规则 | 说明 |
|---|---|
| 答案不上传 | 所有答案保存在浏览器内存和 `localStorage` |
| 题目随机 | 每次新测试都会打乱常规题顺序 |
| 补充题随机插入 | `drink_gate_q1` 插入位置随机 |
| 隐藏题条件插入 | 只有选择“饮酒”才出现 `drink_gate_q2` |
| 常规结果按距离匹配 | `distance` 最小的人格胜出 |
| 匹配度低会兜底 | 最高匹配低于 60% 展示 `HHHH` |
| 隐藏人格优先级最高 | 命中 `DRUNK` 后跳过常规匹配 |
| 最终人格数量 | 27 种 |
