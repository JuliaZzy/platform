const bcrypt = require('bcrypt');

// ▼▼▼ 在这里输入您想设置的新密码 ▼▼▼
const myNewPassword = 'Saif2025'; 

const saltRounds = 10;

async function createHash() {
  if (!myNewPassword || myNewPassword === '在此处输入您想设置的超级安全的密码') {
    console.error('错误：请先在脚本中第5行设置您的密码 (myNewPassword)！');
    return;
  }

  console.log('⏳ 正在为您生成密码哈希...');
  const hashedPassword = await bcrypt.hash(myNewPassword, saltRounds);

  console.log('\n✅ 您的密码哈希值已生成！');
  console.log('👇 请复制下面这整行哈希值，并将其用于下一步的数据库更新中：\n');
  console.log(hashedPassword);
}

createHash();