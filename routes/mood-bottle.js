/**
 * 心情漂流瓶路由
 * 处理匿名心情分享相关的API请求
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 分类配置
const CATEGORIES = {
    all: { label: '全部', value: 'all' },
    happy: { label: '开心', value: 'happy', icon: '😊' },
    anxious: { label: '焦虑', value: 'anxious', icon: '😰' },
    confused: { label: '迷茫', value: 'confused', icon: '😵' },
    complain: { label: '吐槽', value: 'complain', icon: '😤' }
};

// 交互类型
const INTERACTION_TYPES = {
    RESONANCE: 'resonance',
    REPORT: 'report',
    VIEW: 'view',
    OWNER: 'owner'
};

/**
 * 生成随机昵称
 * 格式：漂流瓶#{4-6位数字}
 */
function generateNickname() {
    const length = Math.floor(Math.random() * 3) + 4; // 4-6位
    const number = Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
    return `漂流瓶#${number}`;
}

/**
 * 获取心情列表
 * GET /api/mood-bottle/moods
 */
router.get('/moods', (req, res) => {
    const db = req.app.locals.db;
    const { category = 'all', page = 1, limit = 10, sessionId, reportedOnly = false } = req.query;

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // 构建查询条件
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (category !== 'all') {
            whereClause += ' AND category = ?';
            params.push(category);
        }

        if (reportedOnly === 'true') {
            whereClause += ' AND is_reported = 1';
        }

        // 查询总数
        const countResult = db.prepare(`
            SELECT COUNT(*) as total
            FROM moods
            ${whereClause}
        `).get(...params);

        // 查询心情列表
        const moods = db.prepare(`
            SELECT id, nickname, content, category, resonance_count, view_count, is_reported, created_at
            FROM moods
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `).all(...params, parseInt(limit), offset);

        // 获取用户的交互记录
        let userInteractions = {};
        if (sessionId) {
            const interactions = db.prepare(`
                SELECT mood_id, interaction_type
                FROM user_interactions
                WHERE session_id = ?
            `).all(sessionId);

            interactions.forEach(item => {
                if (!userInteractions[item.mood_id]) {
                    userInteractions[item.mood_id] = {};
                }
                userInteractions[item.mood_id][item.interaction_type] = true;
            });
        }

        // 组装返回数据
        const data = moods.map(mood => ({
            id: mood.id,
            nickname: mood.nickname,
            content: mood.content,
            category: mood.category,
            categoryLabel: CATEGORIES[mood.category]?.label || mood.category,
            resonanceCount: mood.resonance_count,
            viewCount: mood.view_count,
            isReported: mood.is_reported === 1,
            createdAt: mood.created_at,
            userInteraction: userInteractions[mood.id] || {}
        }));

        res.json({
            success: true,
            data: {
                list: data,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    totalPages: Math.ceil(countResult.total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('获取心情列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取心情列表失败'
        });
    }
});

/**
 * 发布心情
 * POST /api/mood-bottle/moods
 */
router.post('/moods', (req, res) => {
    const db = req.app.locals.db;
    const { content, category, sessionId } = req.body;

    try {
        // 参数验证
        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                error: '内容不能为空'
            });
        }

        if (content.length > 200) {
            return res.status(400).json({
                success: false,
                error: '内容不能超过200字'
            });
        }

        if (!category || !CATEGORIES[category] || category === 'all') {
            return res.status(400).json({
                success: false,
                error: '请选择有效的心情分类'
            });
        }

        // 生成心情ID和昵称
        const moodId = `mood_${Date.now()}`;
        const nickname = generateNickname();

        // 插入心情
        db.prepare(`
            INSERT INTO moods (id, nickname, content, category)
            VALUES (?, ?, ?, ?)
        `).run(moodId, nickname, content.trim(), category);

        // 记录所有者关系
        if (sessionId) {
            db.prepare(`
                INSERT INTO user_interactions (id, session_id, mood_id, interaction_type)
                VALUES (?, ?, ?, ?)
            `).run(uuidv4(), sessionId, moodId, INTERACTION_TYPES.OWNER);
        }

        // 更新统计数据
        db.prepare(`
            UPDATE statistics
            SET stat_value = stat_value + 1, updated_at = CURRENT_TIMESTAMP
            WHERE stat_key IN ('total_moods', 'today_moods')
        `).run();

        // 获取更新后的心情数据
        const newMood = db.prepare(`
            SELECT id, nickname, content, category, resonance_count, view_count, is_reported, created_at
            FROM moods
            WHERE id = ?
        `).get(moodId);

        res.json({
            success: true,
            data: {
                id: newMood.id,
                nickname: newMood.nickname,
                content: newMood.content,
                category: newMood.category,
                categoryLabel: CATEGORIES[newMood.category].label,
                resonanceCount: newMood.resonance_count,
                viewCount: newMood.view_count,
                isReported: false,
                createdAt: newMood.created_at,
                userInteraction: { owner: true }
            },
            message: '已投递，悄悄被放入大海'
        });
    } catch (error) {
        console.error('发布心情失败:', error);
        res.status(500).json({
            success: false,
            error: '发布心情失败'
        });
    }
});

/**
 * 共鸣/取消共鸣
 * POST /api/mood-bottle/resonance
 */
router.post('/resonance', (req, res) => {
    const db = req.app.locals.db;
    const { moodId, sessionId } = req.body;

    try {
        // 参数验证
        if (!moodId || !sessionId) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数'
            });
        }

        // 检查心情是否存在
        const mood = db.prepare('SELECT * FROM moods WHERE id = ?').get(moodId);
        if (!mood) {
            return res.status(404).json({
                success: false,
                error: '心情不存在'
            });
        }

        // 检查是否是自己的心情
        const isOwner = db.prepare(`
            SELECT * FROM user_interactions
            WHERE session_id = ? AND mood_id = ? AND interaction_type = ?
        `).get(sessionId, moodId, INTERACTION_TYPES.OWNER);

        if (isOwner) {
            return res.status(403).json({
                success: false,
                error: '不能对自己发布的心情共鸣'
            });
        }

        // 检查是否已共鸣
        const existingResonance = db.prepare(`
            SELECT * FROM user_interactions
            WHERE session_id = ? AND mood_id = ? AND interaction_type = ?
        `).get(sessionId, moodId, INTERACTION_TYPES.RESONANCE);

        let isResonated = false;
        let newCount = mood.resonance_count;

        if (existingResonance) {
            // 取消共鸣
            db.prepare(`
                DELETE FROM user_interactions
                WHERE session_id = ? AND mood_id = ? AND interaction_type = ?
            `).run(sessionId, moodId, INTERACTION_TYPES.RESONANCE);

            // 减少共鸣数
            db.prepare(`
                UPDATE moods
                SET resonance_count = MAX(0, resonance_count - 1), updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(moodId);

            newCount = Math.max(0, mood.resonance_count - 1);
            isResonated = false;
        } else {
            // 添加共鸣
            db.prepare(`
                INSERT INTO user_interactions (id, session_id, mood_id, interaction_type)
                VALUES (?, ?, ?, ?)
            `).run(uuidv4(), sessionId, moodId, INTERACTION_TYPES.RESONANCE);

            // 增加共鸣数
            db.prepare(`
                UPDATE moods
                SET resonance_count = resonance_count + 1, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(moodId);

            newCount = mood.resonance_count + 1;
            isResonated = true;
        }

        res.json({
            success: true,
            data: {
                isResonated: isResonated,
                resonanceCount: newCount
            }
        });
    } catch (error) {
        console.error('共鸣操作失败:', error);
        res.status(500).json({
            success: false,
            error: '共鸣操作失败'
        });
    }
});

/**
 * 举报心情
 * POST /api/mood-bottle/report
 */
router.post('/report', (req, res) => {
    const db = req.app.locals.db;
    const { moodId, sessionId } = req.body;

    try {
        // 参数验证
        if (!moodId || !sessionId) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数'
            });
        }

        // 检查心情是否存在
        const mood = db.prepare('SELECT * FROM moods WHERE id = ?').get(moodId);
        if (!mood) {
            return res.status(404).json({
                success: false,
                error: '心情不存在'
            });
        }

        // 检查是否是自己的心情
        const isOwner = db.prepare(`
            SELECT * FROM user_interactions
            WHERE session_id = ? AND mood_id = ? AND interaction_type = ?
        `).get(sessionId, moodId, INTERACTION_TYPES.OWNER);

        if (isOwner) {
            return res.status(403).json({
                success: false,
                error: '不能举报自己的心情'
            });
        }

        // 检查是否已举报
        const existingReport = db.prepare(`
            SELECT * FROM user_interactions
            WHERE session_id = ? AND mood_id = ? AND interaction_type = ?
        `).get(sessionId, moodId, INTERACTION_TYPES.REPORT);

        if (existingReport) {
            return res.status(400).json({
                success: false,
                error: '你已经举报过该内容'
            });
        }

        // 添加举报记录
        db.prepare(`
            INSERT INTO user_interactions (id, session_id, mood_id, interaction_type)
            VALUES (?, ?, ?, ?)
        `).run(uuidv4(), sessionId, moodId, INTERACTION_TYPES.REPORT);

        // 更新心情的举报状态
        db.prepare(`
            UPDATE moods
            SET is_reported = 1, report_count = report_count + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(moodId);

        res.json({
            success: true,
            data: {
                isReported: true
            },
            message: '举报成功，我们会尽快处理'
        });
    } catch (error) {
        console.error('举报失败:', error);
        res.status(500).json({
            success: false,
            error: '举报失败'
        });
    }
});

/**
 * 记录浏览
 * POST /api/mood-bottle/view
 */
router.post('/view', (req, res) => {
    const db = req.app.locals.db;
    const { moodId, sessionId } = req.body;

    try {
        // 参数验证
        if (!moodId || !sessionId) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数'
            });
        }

        // 检查心情是否存在
        const mood = db.prepare('SELECT * FROM moods WHERE id = ?').get(moodId);
        if (!mood) {
            return res.status(404).json({
                success: false,
                error: '心情不存在'
            });
        }

        // 检查是否已浏览
        const existingView = db.prepare(`
            SELECT * FROM user_interactions
            WHERE session_id = ? AND mood_id = ? AND interaction_type = ?
        `).get(sessionId, moodId, INTERACTION_TYPES.VIEW);

        if (existingView) {
            // 已浏览过，不计数
            return res.json({
                success: true,
                data: {
                    viewCount: mood.view_count,
                    isNewView: false
                }
            });
        }

        // 记录浏览
        db.prepare(`
            INSERT INTO user_interactions (id, session_id, mood_id, interaction_type)
            VALUES (?, ?, ?, ?)
        `).run(uuidv4(), sessionId, moodId, INTERACTION_TYPES.VIEW);

        // 增加浏览数
        db.prepare(`
            UPDATE moods
            SET view_count = view_count + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(moodId);

        res.json({
            success: true,
            data: {
                viewCount: mood.view_count + 1,
                isNewView: true
            }
        });
    } catch (error) {
        console.error('记录浏览失败:', error);
        res.status(500).json({
            success: false,
            error: '记录浏览失败'
        });
    }
});

/**
 * 获取统计数据
 * GET /api/mood-bottle/statistics
 */
router.get('/statistics', (req, res) => {
    const db = req.app.locals.db;

    try {
        // 获取总心情数
        const totalResult = db.prepare(`
            SELECT stat_value as total
            FROM statistics
            WHERE stat_key = 'total_moods'
        `).get();

        // 获取今日新增数（需要重置逻辑）
        let todayResult = db.prepare(`
            SELECT stat_value as today
            FROM statistics
            WHERE stat_key = 'today_moods'
        `).get();

        // 检查是否需要重置今日统计（简化版，实际应该用定时任务）
        const lastResetDate = db.prepare(`
            SELECT stat_value
            FROM statistics
            WHERE stat_key = 'last_reset_date'
        `).get();

        const today = new Date().toDateString();
        if (lastResetDate && lastResetDate.stat_value !== today) {
            // 重置今日统计
            db.prepare(`
                UPDATE statistics
                SET stat_value = 0, updated_at = CURRENT_TIMESTAMP
                WHERE stat_key = 'today_moods'
            `).run();

            db.prepare(`
                UPDATE statistics
                SET stat_value = ?, updated_at = CURRENT_TIMESTAMP
                WHERE stat_key = 'last_reset_date'
            `).run(today);

            todayResult = { today: 0 };
        }

        res.json({
            success: true,
            data: {
                totalMoods: totalResult?.total || 0,
                todayMoods: todayResult?.today || 0
            }
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({
            success: false,
            error: '获取统计数据失败'
        });
    }
});

/**
 * 获取分类配置
 * GET /api/mood-bottle/categories
 */
router.get('/categories', (req, res) => {
    res.json({
        success: true,
        data: CATEGORIES
    });
});

module.exports = router;
