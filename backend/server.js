const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require('openai');
const winston = require('winston');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// 日志配置
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: '请求过于频繁，请稍后再试' }
});
app.use('/api/', limiter);

// 数据库连接
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/aicompanion',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Redis连接
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.connect().catch(console.error);

// OpenAI配置
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-test-key'
});

// JWT验证中间件
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供访问令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret');
    
    // 验证token是否在Redis中（未注销）
    const sessionKey = `session:${decoded.userId}`;
    const sessionExists = await redisClient.get(sessionKey);
    
    if (!sessionExists) {
      return res.status(401).json({ error: '会话已过期' });
    }

    req.userId = decoded.userId;
    req.phone = decoded.phone;
    next();
  } catch (err) {
    return res.status(403).json({ error: '无效的访问令牌' });
  }
};

// ===== API路由 =====

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 用户注册/登录（使用手机号+验证码）
app.post('/api/auth/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '无效的手机号' });
    }

    // 生成6位验证码
    const code = Math.random().toString().slice(2, 8);
    
    // 存储到Redis，5分钟有效
    await redisClient.setEx(`verify:${phone}`, 300, code);
    
    // 实际项目中这里调用短信服务发送验证码
    logger.info(`验证码已生成: ${phone} -> ${code}`);
    
    res.json({ 
      message: '验证码已发送',
      // 仅在开发环境返回验证码
      code: process.env.NODE_ENV !== 'production' ? code : undefined
    });
  } catch (error) {
    logger.error('发送验证码失败:', error);
    res.status(500).json({ error: '发送失败' });
  }
});

// 验证码登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    // 验证验证码
    const storedCode = await redisClient.get(`verify:${phone}`);
    if (storedCode !== code) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // 查找或创建用户
    let user = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    
    if (user.rows.length === 0) {
      // 创建新用户
      const newUser = await pool.query(
        'INSERT INTO users (phone, nickname) VALUES ($1, $2) RETURNING *',
        [phone, `用户${phone.slice(-4)}`]
      );
      user = newUser;
      logger.info(`新用户注册: ${phone}`);
    } else {
      // 更新最后登录时间
      await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.rows[0].id]);
    }

    const userId = user.rows[0].id;

    // 生成JWT
    const token = jwt.sign(
      { userId, phone },
      process.env.JWT_SECRET || 'your-secret',
      { expiresIn: '7d' }
    );

    // 存储会话到Redis
    await redisClient.setEx(`session:${userId}`, 604800, token);

    // 删除验证码
    await redisClient.del(`verify:${phone}`);

    res.json({
      token,
      user: {
        id: userId,
        phone: user.rows[0].phone,
        nickname: user.rows[0].nickname,
        avatar: user.rows[0].avatar
      }
    });
  } catch (error) {
    logger.error('登录失败:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 获取用户信息
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, phone, nickname, avatar, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    res.json({ user: user.rows[0] });
  } catch (error) {
    logger.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 更新用户信息
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { nickname, avatar } = req.body;
    const user = await pool.query(
      'UPDATE users SET nickname = COALESCE($1, nickname), avatar = COALESCE($2, avatar) WHERE id = $3 RETURNING *',
      [nickname, avatar, req.userId]
    );
    res.json({ user: user.rows[0] });
  } catch (error) {
    logger.error('更新用户信息失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// 获取角色列表
app.get('/api/characters', authenticateToken, async (req, res) => {
  try {
    const characters = await pool.query('SELECT * FROM characters ORDER BY id');
    
    // 获取用户与每个角色的亲密度
    const intimacyData = await pool.query(
      'SELECT character_id, intimacy_level, intimacy_points FROM user_character_intimacy WHERE user_id = $1',
      [req.userId]
    );

    const intimacyMap = {};
    intimacyData.rows.forEach(i => {
      intimacyMap[i.character_id] = i;
    });

    const result = characters.rows.map(char => ({
      ...char,
      intimacy: intimacyMap[char.id] || { intimacy_level: 1, intimacy_points: 0 }
    }));

    res.json({ characters: result });
  } catch (error) {
    logger.error('获取角色列表失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 获取聊天记录
app.get('/api/chat/:characterId', authenticateToken, async (req, res) => {
  try {
    const { characterId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await pool.query(
      `SELECT * FROM chat_messages 
       WHERE user_id = $1 AND character_id = $2 
       ORDER BY created_at DESC 
       LIMIT $3 OFFSET $4`,
      [req.userId, characterId, limit, offset]
    );

    res.json({ messages: messages.rows.reverse() });
  } catch (error) {
    logger.error('获取聊天记录失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 发送消息
app.post('/api/chat/:characterId', authenticateToken, async (req, res) => {
  try {
    const { characterId } = req.params;
    const { content, type = 'text' } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    // 获取角色信息
    const character = await pool.query('SELECT * FROM characters WHERE id = $1', [characterId]);
    if (character.rows.length === 0) {
      return res.status(404).json({ error: '角色不存在' });
    }

    // 保存用户消息
    const userMessage = await pool.query(
      'INSERT INTO chat_messages (user_id, character_id, content, role, message_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, characterId, content, 'user', type]
    );

    // 更新亲密度
    await pool.query(
      `INSERT INTO user_character_intimacy (user_id, character_id, intimacy_level, intimacy_points)
       VALUES ($1, $2, 1, 1)
       ON CONFLICT (user_id, character_id) 
       DO UPDATE SET 
         intimacy_points = user_character_intimacy.intimacy_points + 1,
         intimacy_level = CASE 
           WHEN user_character_intimacy.intimacy_points + 1 >= 100 THEN user_character_intimacy.intimacy_level + 1
           ELSE user_character_intimacy.intimacy_level
         END,
         updated_at = CURRENT_TIMESTAMP`,
      [req.userId, characterId]
    );

    // 获取更新后的亲密度
    const intimacy = await pool.query(
      'SELECT intimacy_level FROM user_character_intimacy WHERE user_id = $1 AND character_id = $2',
      [req.userId, characterId]
    );

    // 调用AI生成回复
    const aiResponse = await generateAIResponse(content, character.rows[0]);

    // 保存AI回复
    const aiMessage = await pool.query(
      'INSERT INTO chat_messages (user_id, character_id, content, role, message_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, characterId, aiResponse, 'assistant', 'text']
    );

    // 通过WebSocket推送
    io.to(`user:${req.userId}`).emit('new_message', {
      userMessage: userMessage.rows[0],
      aiMessage: aiMessage.rows[0],
      intimacyLevel: intimacy.rows[0]?.intimacy_level || 1
    });

    res.json({
      userMessage: userMessage.rows[0],
      aiMessage: aiMessage.rows[0],
      intimacyLevel: intimacy.rows[0]?.intimacy_level || 1
    });
  } catch (error) {
    logger.error('发送消息失败:', error);
    res.status(500).json({ error: '发送失败' });
  }
});

// AI回复生成函数
async function generateAIResponse(userMessage, character) {
  try {
    const systemPrompt = `你是${character.name}，${character.description}。${character.personality}。
请记住你的人设，用第一人称回复用户。保持友好、自然，适当使用表情符号。回复简短自然，像是日常对话。`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 200,
      temperature: 0.8
    });

    return completion.choices[0].message.content;
  } catch (error) {
    logger.error('AI生成回复失败:', error);
    // 返回预设回复
    const fallbacks = character.name === '罗伯特' ? [
      '哈哈，这个真的很有趣！让我想想...🤔',
      '我完全理解你的感受，有时候生活就是这样充满惊喜呢！✨',
      '哇，听你这么说我也觉得很开心！要不要多聊聊？😄'
    ] : [
      '喵~ 真的吗？我也想要！蹭蹭~ 🐾',
      '主人好坏哦，都不陪我玩...不过我还是最喜欢你了！💕',
      '嘿嘿，这个我知道！让我用猫猫的智慧想想...🐱✨'
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

// 获取亲密度详情
app.get('/api/intimacy/:characterId', authenticateToken, async (req, res) => {
  try {
    const { characterId } = req.params;
    
    const intimacy = await pool.query(
      'SELECT * FROM user_character_intimacy WHERE user_id = $1 AND character_id = $2',
      [req.userId, characterId]
    );

    res.json({ 
      intimacy: intimacy.rows[0] || { intimacy_level: 1, intimacy_points: 0 }
    });
  } catch (error) {
    logger.error('获取亲密度失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 记录语音通话
app.post('/api/calls/:characterId', authenticateToken, async (req, res) => {
  try {
    const { characterId } = req.params;
    const { duration, status } = req.body;

    const call = await pool.query(
      'INSERT INTO voice_calls (user_id, character_id, duration, status, ended_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [req.userId, characterId, duration, status]
    );

    res.json({ call: call.rows[0] });
  } catch (error) {
    logger.error('记录通话失败:', error);
    res.status(500).json({ error: '记录失败' });
  }
});

// 获取通话记录
app.get('/api/calls', authenticateToken, async (req, res) => {
  try {
    const calls = await pool.query(
      `SELECT vc.*, c.name as character_name, c.avatar as character_avatar
       FROM voice_calls vc
       JOIN characters c ON vc.character_id = c.id
       WHERE vc.user_id = $1
       ORDER BY vc.started_at DESC
       LIMIT 20`,
      [req.userId]
    );
    res.json({ calls: calls.rows });
  } catch (error) {
    logger.error('获取通话记录失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// WebSocket连接处理
io.on('connection', (socket) => {
  logger.info(`WebSocket连接: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
    logger.info(`用户 ${userId} 加入房间`);
  });

  socket.on('disconnect', () => {
    logger.info(`WebSocket断开: ${socket.id}`);
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`🚀 AI陪伴产品后端服务已启动`);
  logger.info(`📡 HTTP端口: ${PORT}`);
  logger.info(`🔌 WebSocket已启用`);
});

module.exports = { app, server, pool };