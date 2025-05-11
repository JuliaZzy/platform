# 设置提交信息（可传参也可默认）
param (
    [string]$message = "Update project"
)

# 确保在项目根目录下执行
Write-Output "📁 当前目录: $PWD"

# 添加所有更改
git add .

# 提交更改
git commit -m "$message"

# 推送到远程仓库
git push origin main

Write-Output "✅ 推送完成：$message"
