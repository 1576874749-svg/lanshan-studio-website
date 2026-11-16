# 蓝山工作室官网：JSON 字段规范与年度维护制度

> 当前为静态官网数据规范 v1。此阶段**保留原有占位内容**，不代表内容已核实，禁止将示例统计作为真实业绩发布。

## 1. 目录与数据源

- `data/manifest.json`：唯一的文件索引和维护元信息。
- `data/metrics.json`：首页统计数据。
- `data/departments.json`：部门、下属组别和成员。
- `data/projects.json`：项目案例。
- `data/alumni.json`：校友毕业去向（公开前需取得本人授权）。
- `data/cities.json`：校友地图的城市标记坐标。
- `data/history/YYYY-YYYY/`：每个学年正式资料的不可变快照，换届时生成；本次不创建虚假的历史档案。
- 下一阶段新增 `site.json`（官方介绍与联系方式）、`recruitment.json`（招新时间、入口、二维码）、`achievements.json`（经核实的成果）等时，应先更新 manifest、验证脚本和读取代码，再发布。

每个数据文件保留对应的顶层复数键，原有页面继续使用 `state.data.metrics / departments / projects / alumni / cities`，不需要更改渲染模板。

## 2. 基础规则

- 文件采用 UTF-8 JSON；所有字段用双引号，不写注释和尾随逗号。
- `id` 为稳定的英文标识符；**不得因为换届、负责人变化而更改**。删除后也不得复用。
- `schemaVersion` 是数据接口版本，改变字段含义或删改必填字段时增加版本号并同时更新代码。
- `academicYear` 表示当前维护学年，格式 `YYYY-YYYY`（后一年度=前一年度+1）。
- 未经核实的数据不可标成真实统计；占位内容在发布前应替换或隐藏。
- 对成员/校友的姓名、届次、单位、照片、感言，应先取得明确的公开授权；不公开个人手机号码、群管理凭证和未授权的私密联系信息。
- 图片使用仓库中的相对路径，文件名应稳定，更新时检查真实存在及版权授权。
- **不要在 JSON 中存储 API 密钥、账号密码或任何私钥**，仓库是公开的。

## 3. 字段字典（当前 v1）

| 文件 | 字段路径 | 类型 | 必填 | 规则 |
|---|---|---|---|---|
| manifest | `schemaVersion` | integer | 是 | 当前为 1 |
| manifest | `academicYear` | string | 是 | YYYY-YYYY，年度连续 |
| manifest | `files` | object | 是 | 包含 metrics / departments / projects / alumni / cities 五个相对文件名 |
| manifest | `maintenance.lastReviewed` | string | 是 | 经核实后填 YYYY-MM-DD；未核实为空 |
| manifest | `maintenance.reviewedBy` | string | 是 | 经审核后填写维护人或团队；未审核为空 |
| manifest | `maintenance.notes` | string | 否 | 更新摘要和数据说明 |
| metrics | `metrics[]` | array | 是 | 首页统计项目 |
| metrics | `value` | number | 是 | 非负数；必须是真实、已核实数值才能正式展示 |
| metrics | `suffix` | string | 是 | 年、+、城等单位 |
| metrics | `label` | string | 是 | 可读的展示名称 |
| departments | `departments[]` | array | 是 | 不允许重复 id |
| departments | `id` | string | 是 | 稳定机器标识 |
| departments | `name/code` | string | 是 | 中文名称 / 英文类别 |
| departments | `x/y` | number | 是 | 桌面拓扑百分比 0–100 |
| departments | `lead` | string | 是 | 当前负责人展示文案，未授权可隐藏 |
| departments | `description` | string | 是 | 该部门职能 |
| departments | `tech` | string[] | 是 | 技术与方向标签 |
| departments | `subteams` | array | 是 | 无组别时为 [] |
| departments | `subteams[].id/name/code` | string | 是 | 组别标识 / 名称 / 类别 |
| departments | `subteams[].x/y` | number | 是 | 拓扑百分比 0–100 |
| departments | `subteams[].description` | string | 是 | 组别职能 |
| departments | `subteams[].tech` | string[] | 是 | 技术与方向 |
| departments | `members` | string[] | 是 | 仅公开获授权成员信息 |
| projects | `projects[]` | array | 是 | 不允许重复 id |
| projects | `id/name/glyph/summary/description` | string | 是 | 唯一标识、名称、简记、摘要、详细介绍 |
| projects | `caseStudy.background/solution/impact` | string | 是 | 背景、方案、效果；效果需可核验 |
| projects | `status` | string | 是 | 现有 `live` 或 `done` |
| projects | `statusLabel/year/owner` | string | 是 | 展示状态、年度、责任部门 |
| projects | `tech` | string[] | 是 | 技术栈标签 |
| projects | `bg` | string | 是 | 目前使用 CSS 渐变字符串；只允许仓库维护者修改 |
| alumni | `alumni[]` | array | 是 | 每条为一位已授权或匿名示例校友 |
| alumni | `name/company/role/city/quote` | string | 是 | 展示姓名、单位、岗位、城市、感言 |
| alumni | `year` | integer | 是 | 毕业年份 |
| cities | `cities[]` | array | 是 | 城市坐标，用于现有 SVG 地图 |
| cities | `name` | string | 是 | 应与 alumni.city 匹配 |
| cities | `x/y` | number | 是 | 当前 SVG viewBox 760×540 内的数值坐标 |

## 4. 每届维护流程

1. **学期末整理**：负责人确认现任部门、项目进展与招新状态；核实展示数据和公开授权。
2. **先归档再更新**：在 `data/history/YYYY-YYYY/` 保存上一届已核实的各数据文件快照及来源说明。历史快照仅记录公开可披露信息。
3. **开启新分支**：例如 `content/2027-2028`，只调整 JSON 与媒体资源，原则上不修改动画。
4. **更新 manifest**：改 `academicYear`、审核日期与审核人；标注本次改变的内容。
5. **运行验证**：`npm run validate:data`；确认数据类型、ID 唯一性、关联城市和坐标合法。
6. **预览核对**：利用 Netlify Deploy Preview 检查电脑/手机端、二维码有效期、邮箱、招新状态、页面跳转。
7. **双人审核**：至少一位内容负责人核实事实、一位技术负责人核对显示和部署；Pull Request 通过后才能合并 `main`。
8. **发布后复查**：再次打开正式域名验证；出现错误时通过 Git 提交或 Netlify 部署回滚。

建议每学期检查一次联系人和招新入口；每次活动结束及时下线过期二维码；有新项目或校友授权时随时更新。至少每年换届时执行完整审核。

## 5. 正式上线门槛

- `data/manifest.json` 的 `maintenance.lastReviewed` 与 `reviewedBy` 不为空。
- 全站不得保留虚构统计、测试二维码、示例邮箱或“原型数据”误导性表述。
- 重要数据要能追溯来源；隐私与图片版权得到确认。
- 手机和桌面端交互通过检查，数据缺失时有合理错误展示。
- 合并前必须通过数据校验与代码审查。

## 6. 本阶段变更范围

此次只将原 `site-data.json` 五个数组**等值拆分**成五份 JSON，引入 manifest 和集中加载逻辑，**不更改任何页面展示数据和交互功能**。未来字段调整必须先更新规范、校验与加载适配，再更新页面。
