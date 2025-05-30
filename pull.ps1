# pull.ps1
# 用于从 GitHub 拉取最新代码

param (
    [string]$message = "Update project"
)

# 显示当前目录
Write-Output "📁 当前目录: $PWD"

# 切换到 main 分支
git checkout main

# 拉取最新更新
git pull origin main

# 显示完成信息
Write-Output "✅ 拉取完成：$message"
