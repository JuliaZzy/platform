const nodemailer = require('nodemailer');
require('dotenv').config();

// ▼▼▼ 在这里定义常量 ▼▼▼
const EMAIL_USER = process.env.EMAIL_USER; // 直接从环境变量获取
const EMAIL_PASS = process.env.EMAIL_PASS; // 直接从环境变量获取
// ▲▲▲ 在这里定义常量 ▲▲▲

// 检查环境变量是否成功加载 (可选的调试步骤)
if (!EMAIL_USER || !EMAIL_PASS) {
  console.error("错误：EMAIL_USER 或 EMAIL_PASS 环境变量未设置！请检查 .env 文件。");
  // 可以选择在这里抛出错误或退出，以防止后续因凭证缺失导致的问题
}

// 创建一个 Nodemailer 的 "transporter" 对象
// 我们使用 QQ 邮箱的 SMTP 服务
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true,  // <-- 开启调试信息
  logger: true  // <-- 将调试信息输出到控制台 (或自定义日志处理)
});


// 创建一个发送邮件的函数
const sendFeedbackEmail = async (feedbackData) => {
  const { name, contact, organization, details } = feedbackData;

  const mailOptions = {
    from: EMAIL_USER, // 直接使用认证的邮箱地址
    to: '867306335@qq.com', 
    subject: '来自数据资产平台的新反馈/申报', // 邮件主题
    html: ` 
      <h2>您收到一条新的反馈/申报：</h2>
      <p><strong>姓名：</strong> ${name}</p>
      <p><strong>联系方式：</strong> ${contact}</p>
      <p><strong>单位：</strong> ${organization || '未填写'}</p> 
      <hr>
      <p><strong>详情：</strong></p>
      <p>${details.replace(/\n/g, '<br>')}</p> 
      <hr>
      <p>邮件发送时间：${new Date().toLocaleString()}</p>
    ` // ▲▲▲ 确保这里是反引号 (`) 结束 ▲▲▲
  };

  try {
      let info = await transporter.sendMail(mailOptions);
      console.log('邮件发送成功:', info.messageId);
      return true; // 发送成功返回 true
  } catch (error) {
      console.error('❌ 邮件发送失败:', error);
      return false; // 发送失败返回 false
  }
};

module.exports = { sendFeedbackEmail };