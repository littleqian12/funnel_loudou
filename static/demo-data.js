/* Demo snapshot for the public GitHub Pages preview.
 * All records are synthetic. Dates are relative to the moment the demo is seeded,
 * so the queue, overdue and archive sections stay realistic over time.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FunnelDemoData = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DAY = 86400000;
  const iso = n => new Date(n).toISOString();

  function build(now) {
    now = now || Date.now();
    const at = days => iso(now + days * DAY);
    const make = (id, o) => ({
      id: 'demo-' + id,
      url: o.url,
      title: o.title,
      content: o.content || '',
      source: o.source,
      reason: o.reason || '',
      note: o.note || '',
      createdAt: at(o.created),
      expiresAt: at(o.expires),
      status: o.status || 'pending',
      finishedAt: o.finished === undefined ? null : at(o.finished),
      extended: o.extended === true
    });

    return {
      version: 1,
      items: [
        // 今日队列：3 条，按临期排序
        make('q1', {
          source: '小红书',
          title: '小户型书房改造：一面墙的收纳方案',
          url: 'https://www.xiaohongshu.com/explore/64f0demo2',
          reason: '准备改造家里书房，先看动线和预算',
          created: -2,
          expires: 1,
          content: '先量墙面尺寸，再决定洞洞板和吊柜的比例。小空间优先做垂直收纳，别急着买盒子。'
        }),
        make('q2', {
          source: '公众号',
          title: 'AI Agent 的上下文工程：从 RAG 到长期记忆',
          url: 'https://mp.weixin.qq.com/s/demo-agent-context',
          reason: '下周团队分享要用，先拆一遍框架',
          created: -1,
          expires: 2,
          content: '上下文不是越长越好。先分清事实、约束和待办，再决定哪些进入窗口，哪些落到外部记忆。'
        }),
        make('q3', {
          source: '微信读书',
          title: '《深度工作》第 2 章：注意力残留',
          url: 'https://weread.qq.com/web/reader/demo-deep-work',
          reason: '最近总被打断，想把注意力残留的概念用在日程上',
          created: -3,
          expires: 3,
          content: '从任务 A 切到任务 B 后，注意力不会立刻跟过去。频繁切换会把残留带进下一段工作。'
        }),

        // 已到期，等待决定
        make('o1', {
          source: '知乎',
          title: '如何评价 2026 年的 AI 编程工具？',
          url: 'https://www.zhihu.com/question/100000001',
          reason: '团队选型前想看看不同工具的取舍',
          created: -9,
          expires: -1
        }),
        make('o2', {
          source: '抖音',
          title: '三分钟看懂主动降噪耳机的原理',
          url: 'https://www.douyin.com/video/7300000000000000001',
          reason: '买耳机前补一下基础概念',
          created: -7,
          expires: -2
        }),

        // 稍后处理
        make('a1', {
          source: '公众号',
          title: '从 0 到 1 搭建个人知识库',
          url: 'https://mp.weixin.qq.com/s/demo-knowledge-base',
          reason: '周末整理笔记系统时参考',
          created: -4,
          expires: 12
        }),
        make('a2', {
          source: '小红书',
          title: '工作日一周备菜清单',
          url: 'https://www.xiaohongshu.com/explore/64f0demo7',
          reason: '想减少工作日做饭的决策成本',
          created: -5,
          expires: 18,
          extended: true
        }),
        make('a3', {
          source: '网页',
          title: 'MDN：Fetch API 使用指南',
          url: 'https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch',
          reason: '前端重构时查请求写法',
          created: -6,
          expires: 25
        }),

        // 已读完
        make('d1', {
          source: '公众号',
          title: '写好周报的五个结构',
          url: 'https://mp.weixin.qq.com/s/demo-weekly-report',
          reason: '想把周报写得更清楚',
          created: -12,
          expires: -5,
          finished: -5,
          status: 'done',
          note: '先写结论，再补三条证据；周报不是流水账。'
        }),
        make('d2', {
          source: '小红书',
          title: '10 分钟快手早餐：鸡蛋燕麦杯',
          url: 'https://www.xiaohongshu.com/explore/64f0demo12',
          reason: '想让早上的流程更省事',
          created: -14,
          expires: -7,
          finished: -7,
          status: 'done',
          note: '鸡蛋燕麦杯可复用，早上节省 10 分钟。'
        }),
        make('d3', {
          source: '微信读书',
          title: '《卡片笔记写作法》第 3 章',
          url: 'https://weread.qq.com/web/reader/demo-card-notes',
          reason: '想改善读书笔记的复用率',
          created: -16,
          expires: -9,
          finished: -9,
          status: 'done',
          note: '永久笔记不是摘抄，要用自己的话重写并建立连接。'
        }),
        make('d4', {
          source: '知乎',
          title: '如何做一次有效的复盘？',
          url: 'https://www.zhihu.com/question/100000004',
          reason: '季度复盘前找一下框架',
          created: -18,
          expires: -11,
          finished: -11,
          status: 'done',
          note: '复盘拆成事实、判断、下一步三段，避免写成情绪记录。'
        }),
        make('d5', {
          source: '抖音',
          title: '手机摄影构图三招',
          url: 'https://www.douyin.com/video/7300000000000000005',
          reason: '出门拍照时想少一点废片',
          created: -20,
          expires: -13,
          finished: -13,
          status: 'done',
          note: '三分法 + 留白就够用，先练构图再谈设备。'
        }),
        make('d6', {
          source: '网页',
          title: 'SQLite WAL 模式说明',
          url: 'https://www.sqlite.org/wal.html',
          reason: '本地工具想提升并发读写稳定性',
          created: -22,
          expires: -15,
          finished: -15,
          status: 'done',
          note: 'WAL 模式让读写并发更稳，本地工具可以默认开启。'
        }),
        make('d7', {
          source: '公众号',
          title: '把复杂问题讲清楚的表达框架',
          url: 'https://mp.weixin.qq.com/s/demo-expression',
          reason: '准备做一次内部分享',
          created: -24,
          expires: -17,
          finished: -17,
          status: 'done',
          note: '先给结论，再给两到三个支撑点，最后说边界。'
        }),
        make('d8', {
          source: '小红书',
          title: '租房也能做的低成本收纳',
          url: 'https://www.xiaohongshu.com/explore/64f0demo18',
          reason: '搬家前想找一些不破坏墙面的方案',
          created: -26,
          expires: -19,
          finished: -19,
          status: 'done',
          note: '垂直空间和统一容器最有用，先量尺寸再买收纳盒。'
        }),
        make('d9', {
          source: '微信读书',
          title: '《纳瓦尔宝典》：判断力比努力更重要',
          url: 'https://weread.qq.com/web/reader/demo-naval',
          reason: '想重新排一下今年的优先级',
          created: -28,
          expires: -21,
          finished: -21,
          status: 'done',
          note: '判断力来自长期积累的领域知识，不是信息量。'
        }),
        make('d10', {
          source: '知乎',
          title: '为什么我们总是高估一天的产出？',
          url: 'https://www.zhihu.com/question/100000010',
          reason: '做计划时总把日程排得太满',
          created: -30,
          expires: -23,
          finished: -23,
          status: 'done',
          note: '计划要按周而不是按天排，给意外留缓冲。'
        }),

        // 已放走
        make('r1', {
          source: '公众号',
          title: '2026 年十大营销趋势',
          url: 'https://mp.weixin.qq.com/s/demo-marketing-trends',
          reason: '想看看行业叙事，判断是否值得跟进',
          created: -8,
          expires: -3,
          finished: -3,
          status: 'released',
          note: '标题很大，读完摘要发现和当前业务无关，放走。'
        }),
        make('r2', {
          source: '小红书',
          title: '极简主义 100 件物品清单',
          url: 'https://www.xiaohongshu.com/explore/64f0demo20',
          reason: '想检查自己是不是又在用购物代替行动',
          created: -10,
          expires: -4,
          finished: -4,
          status: 'released',
          note: '清单本身没错，但现在不需要靠物品数量定义生活，放走。'
        })
      ]
    };
  }

  return { build };
}));
