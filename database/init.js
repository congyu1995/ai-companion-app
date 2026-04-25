/**
 * 数据库初始化脚本
 * 创建所有必要的数据表
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = path.join(__dirname, 'app.db');

// 确保database目录存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

console.log('📦 开始初始化数据库...\n');

// ========== AI陪伴相关表 ==========

console.log('创建AI陪伴相关表...');

// 用户表
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        session_id TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);
console.log('✅ users 表创建成功');

// 聊天历史表
db.exec(`
    CREATE TABLE IF NOT EXISTS chat_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        character_id TEXT NOT NULL,
        message TEXT NOT NULL,
        is_ai BOOLEAN NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`);
console.log('✅ chat_history 表创建成功');

// 亲密度表
db.exec(`
    CREATE TABLE IF NOT EXISTS intimacy (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        character_id TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, character_id)
    )
`);
console.log('✅ intimacy 表创建成功');

// ========== 心情漂流瓶相关表 ==========

console.log('\n创建心情漂流瓶相关表...');

// 心情表
db.exec(`
    CREATE TABLE IF NOT EXISTS moods (
        id TEXT PRIMARY KEY,
        nickname TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        resonance_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        is_reported BOOLEAN DEFAULT 0,
        report_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);
console.log('✅ moods 表创建成功');

// 用户交互记录表
db.exec(`
    CREATE TABLE IF NOT EXISTS user_interactions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        mood_id TEXT NOT NULL,
        interaction_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mood_id) REFERENCES moods(id),
        UNIQUE(session_id, mood_id, interaction_type)
    )
`);
console.log('✅ user_interactions 表创建成功');

// 统计数据表
db.exec(`
    CREATE TABLE IF NOT EXISTS statistics (
        id TEXT PRIMARY KEY,
        stat_key TEXT UNIQUE NOT NULL,
        stat_value INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);
console.log('✅ statistics 表创建成功');

// ========== 创建索引 ==========

console.log('\n创建索引...');

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chat_history_user ON chat_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_history_character ON chat_history(character_id);
    CREATE INDEX IF NOT EXISTS idx_chat_history_created ON chat_history(created_at);
    
    CREATE INDEX IF NOT EXISTS idx_intimacy_user ON intimacy(user_id);
    CREATE INDEX IF NOT EXISTS idx_intimacy_character ON intimacy(character_id);
    
    CREATE INDEX IF NOT EXISTS idx_moods_category ON moods(category);
    CREATE INDEX IF NOT EXISTS idx_moods_created ON moods(created_at);
    CREATE INDEX IF NOT EXISTS idx_moods_reported ON moods(is_reported);
    
    CREATE INDEX IF NOT EXISTS idx_interactions_session ON user_interactions(session_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_mood ON user_interactions(mood_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_type ON user_interactions(interaction_type);
`);
console.log('✅ 索引创建成功');

// ========== 初始化统计数据 ==========

console.log('\n初始化统计数据...');

const initStats = db.prepare(`
    INSERT OR IGNORE INTO statistics (id, stat_key, stat_value)
    VALUES 
        ('total_moods', 'total_moods', 0),
        ('today_moods', 'today_moods', 0),
        ('last_reset_date', 'last_reset_date', 0)
`);

initStats.run();
console.log('✅ 统计数据初始化成功');

// ========== 插入示例数据 ==========

console.log('\n插入示例数据...');

// 插入示例心情数据
const sampleMoods = [
    {
        id: 'mood_sample_1',
        nickname: '漂流瓶#2341',
        content: '今天阳光很好，心情特别舒畅！\n希望每个人都能遇到美好的事情~',
        category: 'happy',
        resonance_count: 12,
        view_count: 89,
        is_reported: 0
    },
    {
        id: 'mood_sample_2',
        nickname: '漂流瓶#7892',
        content: '工作压力好大，感觉喘不过气来...\n不知道什么时候能放松一下',
        category: 'anxious',
        resonance_count: 28,
        view_count: 156,
        is_reported: 0
    },
    {
        id: 'mood_sample_3',
        nickname: '漂流瓶#4523',
        content: '不知道未来该往哪个方向走\n感觉人生充满了迷茫\n有人能给我一些建议吗？',
        category: 'confused',
        resonance_count: 35,
        view_count: 203,
        is_reported: 0
    },
    {
        id: 'mood_sample_4',
        nickname: '漂流瓶#9812',
        content: '今天的地铁又挤又晚点！\n简直是糟糕透顶的一天！',
        category: 'complain',
        resonance_count: 45,
        view_count: 312,
        is_reported: 0
    }
];

const insertMood = db.prepare(`
    INSERT OR IGNORE INTO moods (id, nickname, content, category, resonance_count, view_count, is_reported)
    VALUES (@id, @nickname, @content, @category, @resonance_count, @view_count, @is_reported)
`);

for (const mood of sampleMoods) {
    insertMood.run(mood);
}

// 更新统计数据
db.prepare(`UPDATE statistics SET stat_value = 4 WHERE stat_key = 'total_moods'`).run();
db.prepare(`UPDATE statistics SET stat_value = 4 WHERE stat_key = 'today_moods'`).run();

console.log('✅ 示例数据插入成功');

// ========== 完成 ==========

console.log('\n🎉 数据库初始化完成！');
console.log(`📍 数据库位置: ${dbPath}\n`);

// 关闭数据库连接
db.close();
