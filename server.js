/**
 * AI Companion App - 后端主入口
 * 集成AI虚拟角色陪伴和心情漂流瓶两个产品
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

// 创建Express应用
const app = express();

// 配置
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 数据库连接
const dbPath = path.join(__dirname, 'database', 'app.db');
let db;

try {
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    console.log('✅ 数据库连接成功');
} catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
}

// 将数据库实例挂载到app
app.locals.db = db;

// ========== 中间件配置 ==========

// CORS配置
app.use(cors({
    origin: NODE_ENV === 'development' ? '*' : process.env.ALLOWED_ORIGINS,
    credentials: true
}));

// JSON解析
app.use(express.json({ limit: '10mb' }));

// URL编码解析
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 请求日志（开发环境）
if (NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}

// ========== 路由配置 ==========

// 引入路由
const aiCompanionRouter = require('./routes/ai-companion');
const moodBottleRouter = require('./routes/mood-bottle');

// 挂载路由
app.use('/api/ai-companion', aiCompanionRouter);
app.use('/api/mood-bottle', moodBottleRouter);

// ========== 页面路由 ==========

// 首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// AI陪伴页面
app.get('/ai-companion', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ai-companion', 'index.html'));
});

// 心情漂流瓶页面
app.get('/mood-bottle', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mood-bottle', 'index.html'));
});

// ========== API健康检查 ==========

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV
    });
});

// ========== 错误处理 ==========

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `路由 ${req.method} ${req.url} 不存在`
    });
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('❌ 错误:', err);
    
    res.status(err.status || 500).json({
        success: false,
        error: err.name || 'Internal Server Error',
        message: NODE_ENV === 'development' ? err.message : '服务器内部错误'
    });
});

// ========== 启动服务器 ==========

const server = app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('🚀 AI Companion App 服务已启动');
    console.log('========================================');
    console.log(`📍 本地访问: http://localhost:${PORT}`);
    console.log(`🌍 环境: ${NODE_ENV}`);
    console.log(`📊 进程ID: ${process.pid}`);
    console.log('========================================\n');
    console.log('📱 访问地址:');
    console.log(`   首页:         http://localhost:${PORT}/`);
    console.log(`   AI陪伴:       http://localhost:${PORT}/ai-companion`);
    console.log(`   心情漂流瓶:   http://localhost:${PORT}/mood-bottle`);
    console.log('========================================\n');
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('\n📛 收到SIGTERM信号，正在关闭服务器...');
    
    server.close(() => {
        console.log('✅ HTTP服务器已关闭');
        
        if (db) {
            db.close();
            console.log('✅ 数据库连接已关闭');
        }
        
        console.log('👋 服务已优雅关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n📛 收到SIGINT信号，正在关闭服务器...');
    
    server.close(() => {
        console.log('✅ HTTP服务器已关闭');
        
        if (db) {
            db.close();
            console.log('✅ 数据库连接已关闭');
        }
        
        console.log('👋 服务已优雅关闭');
        process.exit(0);
    });
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的Promise拒绝:', reason);
});

module.exports = app;
