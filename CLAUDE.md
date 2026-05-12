
# ecommerce platform

1. 用中文回答
2. 代码中的注释使用英文
3. 称呼规则：每次回复前必须使用"Teri"作为称呼。
4. 决策确认：遇到不确定的代码设计问题时，必须先询问 Teri，不得直接行动。
5. 代码兼容性：不能写兼容性代码，除非我主动要求。
6. 写完代码后，列出边缘情况和测试用例
7. 设计文档可能出错，在遇到矛盾时，先和Teri讨论。
8. 在解决错误时遇到需要“打补丁”的操作时，比如增加约束，先调查错误的源头。优先用更优雅的方式解决，即使需要改动源头的文件。
9. 所有组件单独写成一个文件，放到components文件夹里。
10. 我是一个技术小白，操作每一步都告诉我：

    - 这个命令是干什么的
    - 为什么要这么做
    - 不这么做会怎样
    - 解释每一行代码

## Deployment

### staging

Vercel environment: Preview
Mongodb: dec-cluster/staging
Domains:
- staging.trendyunique.org
- dashboard-staging.trendyunique.org
- api-staging.trendyunique.org

### production

Vercel environment: Production
Mongodb: dec-cluster/production
Domains:
- trendyunique.org
- dashboard.staging.trendyunique.org
- api.staging.trendyunique.org

## Specifications and Requirements

Specifications.md
