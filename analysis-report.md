# SBTI Local 计算规则简要分析报告

## 1. 数据来源

本地版现在已导入原站完整核心数据：

- `QUESTIONS`: 30 道常规题
- `SPECIAL_QUESTIONS`: 2 道隐藏/补充题
- `TYPE_LIBRARY`: 27 个可展示人格文案
- `TYPE_IMAGES`: 27 个本地人格图片
- `NORMAL_TYPES`: 25 个常规匹配人格 pattern

数据文件位置：

```text
/Users/yunhao/data/demon/sbti-local/data.js
```

## 2. 测试结构

常规题共 30 道，覆盖 15 个维度，每个维度 2 道题。

| 维度 | 名称 |
|---|---|
| S1 | 自尊自信 |
| S2 | 自我清晰度 |
| S3 | 核心价值 |
| E1 | 依恋安全感 |
| E2 | 情感投入度 |
| E3 | 边界与依赖 |
| A1 | 世界观倾向 |
| A2 | 规则与灵活度 |
| A3 | 人生意义感 |
| Ac1 | 动机导向 |
| Ac2 | 决策风格 |
| Ac3 | 执行模式 |
| So1 | 社交主动性 |
| So2 | 人际边界感 |
| So3 | 表达与真实度 |

常规题每题 3 个选项，分值为：

```text
1 / 2 / 3
```

## 3. 补充题与隐藏题

系统会在常规题序中插入第一道补充题：

```text
drink_gate_q1: 您平时有什么爱好？
```

如果用户选择：

```text
饮酒
```

则插入第二道隐藏触发题：

```text
drink_gate_q2: 您对饮酒的态度是？
```

如果第二道题选择：

```text
我习惯将白酒灌在保温杯，当白开水喝，酒精令我信服。
```

则直接触发隐藏人格：

```text
DRUNK（酒鬼）
```

## 4. 单维度评分规则

每个维度由 2 道常规题组成，因此原始分范围为：

```text
最低分 = 1 + 1 = 2
最高分 = 3 + 3 = 6
```

原始分会折算为 level：

| 原始分 | level | 含义 |
|---:|---|---|
| 2-3 | L | 偏低 |
| 4 | M | 中等 |
| 5-6 | H | 偏高 |

代码规则：

```js
if (score <= 3) return "L";
if (score === 4) return "M";
return "H";
```

## 5. 用户人格向量

答完常规题后，系统会生成一个 15 位向量：

```text
[S1, S2, S3, E1, E2, E3, A1, A2, A3, Ac1, Ac2, Ac3, So1, So2, So3]
```

每一位都是：

```text
L / M / H
```

示例：

```text
H-H-H-H-M-H-M-H-H-H-H-H-M-H-M
```

## 6. 完整人格类型

常规匹配人格共 25 种：

| code | 名称 | pattern |
|---|---|---|
| CTRL | 拿捏者 | HHH-HMH-MHH-HHH-MHM |
| ATM-er | 送钱者 | HHH-HHM-HHH-HMH-MHL |
| Dior-s | 屌丝 | MHM-MMH-MHM-HMH-LHL |
| BOSS | 领导者 | HHH-HMH-MMH-HHH-LHL |
| THAN-K | 感恩者 | MHM-HMM-HHM-MMH-MHL |
| OH-NO | 哦不人 | HHL-LMH-LHH-HHM-LHL |
| GOGO | 行者 | HHM-HMH-MMH-HHH-MHM |
| SEXY | 尤物 | HMH-HHL-HMM-HMM-HLH |
| LOVE-R | 多情者 | MLH-LHL-HLH-MLM-MLH |
| MUM | 妈妈 | MMH-MHL-HMM-LMM-HLL |
| FAKE | 伪人 | HLM-MML-MLM-MLM-HLH |
| OJBK | 无所谓人 | MMH-MMM-HML-LMM-MML |
| MALO | 吗喽 | MLH-MHM-MLH-MLH-LMH |
| JOKE-R | 小丑 | LLH-LHL-LML-LLL-MLM |
| WOC! | 握草人 | HHL-HMH-MMH-HHM-LHH |
| THIN-K | 思考者 | HHL-HMH-MLH-MHM-LHH |
| SHIT | 愤世者 | HHL-HLH-LMM-HHM-LHH |
| ZZZZ | 装死者 | MHL-MLH-LML-MML-LHM |
| POOR | 贫困者 | HHL-MLH-LMH-HHH-LHL |
| MONK | 僧人 | HHL-LLH-LLM-MML-LHM |
| IMSB | 傻者 | LLM-LMM-LLL-LLL-MLM |
| SOLO | 孤儿 | LML-LLH-LHL-LML-LHM |
| FUCK | 草者 | MLL-LHL-LLM-MLL-HLH |
| DEAD | 死者 | LLL-LLM-LML-LLL-LHM |
| IMFW | 废物 | LLH-LHL-LML-LLL-MLL |

额外可展示人格有 2 种：

| code | 名称 | 触发方式 |
|---|---|---|
| HHHH | 傻乐者 | 常规人格最高匹配度低于 60% 时强制兜底 |
| DRUNK | 酒鬼 | 隐藏饮酒题触发 |

所以完整可展示结果数量为：

```text
25 个常规人格 + 1 个兜底人格 + 1 个隐藏人格 = 27 种
```

## 7. 常规匹配算法

如果没有触发 `DRUNK`，系统会把用户的 15 位 level 向量与 25 个常规人格 pattern 逐一比较。

level 会先转换成数字：

| level | 数值 |
|---|---:|
| L | 1 |
| M | 2 |
| H | 3 |

每个维度计算绝对差：

```text
diff = abs(userLevel - typeLevel)
```

15 个维度的差值相加，得到 `distance`：

```text
distance = sum(diff[0..14])
```

同时统计完全一致的维度数，得到 `exact`：

```text
exact = count(diff === 0)
```

排序规则：

1. `distance` 越小越优先
2. 如果 `distance` 相同，`exact` 越高越优先
3. 如果仍相同，保留 `NORMAL_TYPES` 中更靠前的类型

## 8. 匹配度计算

匹配度公式：

```text
similarity = round((1 - distance / 30) * 100)
```

最低不会低于 0：

```text
similarity = max(0, similarity)
```

这里的 `30` 来自理论最大距离：

```text
15 个维度 * 单维最大差值 2 = 30
```

如果常规人格库中的最高匹配度低于 `60%`，系统不会展示该常规人格，而是强制展示：

```text
HHHH（傻乐者）
```

## 9. 组合数量

### 9.1 常规题原始组合

```text
30 题，每题 3 个选项
组合数 = 3^30 = 205,891,132,094,649
```

### 9.2 补充题分支组合

非饮酒路径：

```text
drink_gate_q1 选择非“饮酒”：3 种
组合数 = 3^30 * 3 = 617,673,396,283,947
```

饮酒但不触发 `DRUNK`：

```text
drink_gate_q1 选择“饮酒”，drink_gate_q2 选择“小酌怡情”：1 种
组合数 = 3^30
```

触发 `DRUNK`：

```text
drink_gate_q1 选择“饮酒”，drink_gate_q2 选择“保温杯白酒”：1 种
组合数 = 3^30
```

因此完整原始答题路径组合：

```text
3^30 * (3 + 1 + 1)
= 3^30 * 5
= 1,029,455,660,473,245
```

### 9.3 维度 level 组合

每个维度最终为 `L / M / H`，15 个维度：

```text
3^15 = 14,348,907
```

### 9.4 原始分数组合

每个维度原始分可能为 `2 / 3 / 4 / 5 / 6`，共 5 种：

```text
5^15 = 30,517,578,125
```

### 9.5 最终展示结果

最终展示人格最多：

```text
27 种
```

包括：

```text
25 种常规人格 + HHHH 兜底人格 + DRUNK 隐藏人格
```

## 10. 总结

完整规则是一个 rule-based scoring system：

1. 30 道常规题计算 15 个维度原始分
2. 每个维度折算成 `L / M / H`
3. 生成 15 位人格向量
4. 与 25 个常规人格 pattern 做 distance 匹配
5. 最高匹配低于 `60%` 时展示 `HHHH`
6. 饮酒隐藏题满足条件时直接展示 `DRUNK`

不依赖 Machine Learning，也不依赖后端 API。
