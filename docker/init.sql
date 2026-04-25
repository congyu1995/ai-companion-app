-- 初始化数据库表结构

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    nickname VARCHAR(50) DEFAULT '用户',
    avatar VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
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

-- 用户-角色亲密度表
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

-- 聊天记录表
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'voice'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 语音通话记录表
CREATE TABLE IF NOT EXISTS voice_calls (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    duration INTEGER DEFAULT 0, -- 秒
    status VARCHAR(20) DEFAULT 'completed', -- 'ongoing', 'completed', 'missed'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- 初始化角色数据
INSERT INTO characters (name, avatar, description, personality, color_theme, welcome_message) VALUES
('罗伯特', '🤖', '24小时陪伴你的AI伙伴，随时倾听分享，用幽默点亮你的每一天', 
 '幽默风趣、善解人意、知识渊博、乐观积极', 'blue-purple',
 '你好！我是罗伯特，你的24小时AI伙伴！无论是开心还是难过，我都在这里陪伴你。有什么想聊的吗？😊'),

('萌宠', '🐱', '喵～我是你的长不大的电子小猫咪，爱蹭蹭、听故事，快来和我贴贴吧',
 '可爱粘人、活泼好动、温柔治愈、爱撒娇', 'pink-orange',
 '喵呜~ 主人你来啦！🐱 今天也要开开心心的哦，我最喜欢你笑的样子了~ 有什么好玩的事情要跟我说吗？喵~')

ON CONFLICT DO NOTHING;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_character ON chat_messages(user_id, character_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_character_intimacy_user ON user_character_intimacy(user_id);