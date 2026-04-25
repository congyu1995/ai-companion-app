// Railway部署专用的入口文件
// 适配Railway环境变量的数据库和Redis连接

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 数据库连接 - 适配Railway自动注入的环境变量
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.RAILWAY_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Redis连接
let redisClient;
try {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || process.env.RAILWAY_REDIS_URL || 'redis://localhost:6379'
  });
  redisClient.connect().catch(() => {
    console.log('Redis连接失败，使用内存存储');
  });
} catch (e) {
  console.log('Redis初始化失败，使用内存存储');
}

// 内存存储备选
const memoryStore = {
  sessions: new Map(),
  verifyCodes: new Map(),
  setEx: async (key, seconds, value) => {
    memoryStore[key] = { value, expires: Date.now() + seconds * 1000 };
  },
  get: async (key) => {
    const item = memoryStore[key];
    if (item && item.expires > Date.now()) {
      return item.value;
    }
    return null;
  },
  del: async (key) => {
    delete memoryStore[key];
  }
};

const cacheClient = redisClient && redisClient.isReady ? redisClient : memoryStore;

// OpenAI配置
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'railway-secret-' + Date.now();

// JWT验证中间件
const authenticateToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未提供访问令牌' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const sessionExists = await cacheClient.get(`session:${decoded.userId}`);
    if (!sessionExists) return res.status(401).json({ error: '会话已过期' });
    
    req.userId = decoded.userId;
    req.phone = decoded.phone;
    next();
  } catch (err) {
    return res.status(403).json({ error: '无效的访问令牌' });
  }
};

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// 发送验证码
app.post('/api/auth/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '无效的手机号' });
    }
    
    const code = Math.random().toString().slice(2, 8);
    await cacheClient.setEx(`verify:${phone}`, 300, code);
    
    console.log(`验证码: ${phone} -> ${code}`);
    res.json({ 
      message: '验证码已发送',
      code: code  // 演示环境直接返回
    });
  } catch (error) {
    res.status(500).json({ error: '发送失败' });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    const storedCode = await cacheClient.get(`verify:${phone}`);
    if (storedCode !== code) {
      return res.status(400).json({ error: '验证码错误' });
    }

    // 查找或创建用户
    let user = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    
    if (user.rows.length === 0) {
      const newUser = await pool.query(
        'INSERT INTO users (phone, nickname) VALUES ($1, $2) RETURNING *',
        [phone, `用户${phone.slice(-4)}`]
      );
      user = newUser;
    } else {
      await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.rows[0].id]);
    }

    const userId = user.rows[0].id;
    const token = jwt.sign({ userId, phone }, JWT_SECRET, { expiresIn: '7d' });
    await cacheClient.setEx(`session:${userId}`, 604800, token);
    await cacheClient.del(`verify:${phone}`);

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
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 获取角色列表
app.get('/api/characters', authenticateToken, async (req, res) => {
  try {
    const characters = await pool.query('SELECT * FROM characters ORDER BY id');
    
    const intimacyData = await pool.query(
      'SELECT character_id, intimacy_level, intimacy_points FROM user_character_intimacy WHERE user_id = $1',
      [req.userId]
    );

    const intimacyMap = {};
    intimacyData.rows.forEach(i => { intimacyMap[i.character_id] = i; });

    const result = characters.rows.map(char => ({
      ...char,
      intimacy: intimacyMap[char.id] || { intimacy_level: 1, intimacy_points: 0 }
    }));

    res.json({ characters: result });
  } catch (error) {
    res.status(500).json({ error: '获取失败' });
  }
});

// 获取聊天记录
app.get('/api/chat/:characterId', authenticateToken, async (req, res) => {
  try {
    const { characterId } = req.params;
    const messages = await pool.query(
      `SELECT * FROM chat_messages 
       WHERE user_id = $1 AND character_id = $2 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.userId, characterId]
    );
    res.json({ messages: messages.rows.reverse() });
  } catch (error) {
    res.status(500).json({ error: '获取失败' });
  }
});

// 发送消息
app.post('/api/chat/:characterId', authenticateToken, async (req, res) => {
  try {
    const { characterId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: '内容不能为空' });
    }

    // 获取角色信息
    const character = await pool.query('SELECT * FROM characters WHERE id = $1', [characterId]);
    if (character.rows.length === 0) {
      return res.status(404).json({ error: '角色不存在' });
    }

    // 保存用户消息
    const userMessage = await pool.query(
      'INSERT INTO chat_messages (user_id, character_id, content, role, message_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, characterId, content, 'user', 'text']
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

    const intimacy = await pool.query(
      'SELECT intimacy_level FROM user_character_intimacy WHERE user_id = $1 AND character_id = $2',
      [req.userId, characterId]
    );

    // AI回复
    let aiResponse;
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: `你是${character.rows[0].name}，${character.rows[0].description}。${character.rows[0].personality}。` },
            { role: 'user', content }
          ],
          max_tokens: 200,
          temperature: 0.8
        });
        aiResponse = completion.choices[0].message.content;
      } catch (e) {
        aiResponse = getFallbackResponse(character.rows[0].name);
      }
    } else {
      aiResponse = getFallbackResponse(character.rows[0].name);
    }

    const aiMessage = await pool.query(
      'INSERT INTO chat_messages (user_id, character_id, content, role, message_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, characterId, aiResponse, 'assistant', 'text']
    );

    res.json({
      userMessage: userMessage.rows[0],
      aiMessage: aiMessage.rows[0],
      intimacyLevel: intimacy.rows[0]?.intimacy_level || 1
    });
  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({ error: '发送失败' });
  }
});

function getFallbackResponse(characterName) {
  const responses = characterName === '罗伯特' ? [
    '哈哈，这个真的很有趣！让我想想...🤔',
    '我完全理解你的感受！✨',
    '哇，听你这么说我也觉得很开心！😄'
  ] : [
    '喵~ 我也想要！蹭蹭~ 🐾',
    '主人好坏哦，不过我最喜欢你了！💕',
    '让我用猫猫的智慧想想...🐱✨'
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

// 初始化数据库
async function initDatabase() {
  try {
    // 创建表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        nickname VARCHAR(50) DEFAULT '用户',
        avatar VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS characters (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        avatar VARCHAR(10) NOT NULL,
        description TEXT NOT NULL,
        personality TEXT NOT NULL,
        color_theme VARCHAR(20) NOT NULL,
        welcome_message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_character_intimacy (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
        intimacy_level INTEGER DEFAULT 1,
        intimacy_points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, character_id)
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        role VARCHAR(20) NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS voice_calls (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
        duration INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'completed',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP
      );

      -- 初始化角色数据
      INSERT INTO characters (name, avatar, description, personality, color_theme, welcome_message) VALUES
      ('罗伯特', '🤖', '24小时陪伴你的AI伙伴，随时倾听分享，用幽默点亮你的每一天', 
       '幽默风趣、善解人意、知识渊博、乐观积极', 'blue-purple',
       '你好！我是罗伯特，你的24小时AI伙伴！有什么想聊的吗？😊'),
      ('萌宠', '🐱', '喵～我是你的长不大的电子小猫咪，爱蹭蹭、听故事', 
       '可爱粘人、活泼好动、温柔治愈', 'pink-orange',
       '喵呜~ 主人你来啦！今天也要开开心心的哦~ 🐱')
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('✅ 数据库初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
  }
}

// 启动服务器
const PORT = process.env.PORT || 3000;

initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 AI陪伴产品已启动`);
    console.log(`📡 端口: ${PORT}`);
    console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 OpenAI: ${openai ? '已配置' : '使用模拟回复'}`);
  });
});

module.exports = { app, server };