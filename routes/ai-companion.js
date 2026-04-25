/**
 * AI陪伴路由
 * 处理AI虚拟角色相关的API请求
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 角色配置
const CHARACTERS = {
    robert: {
        id: 'robert',
        name: '罗伯特',
        avatar: '🤖',
        description: '24小时陪伴你的AI伙伴，随时倾听分享，用幽默点亮你的每一天',
        responses: [
            '哈哈，这个真的很有趣！让我想想...🤔',
            '我完全理解你的感受，有时候生活就是这样充满惊喜呢！✨',
            '哇，听你这么说我也觉得很开心！要不要多聊聊？😄',
            '这事儿挺有意思，我觉得你可以试试从另一个角度看看...💡',
            '嗯嗯，我在认真听着呢，继续说吧~👂',
            '听起来你今天过得不错！有什么特别的事情吗？😊',
            '我觉得你的想法很有道理，继续加油！💪'
        ]
    },
    pet: {
        id: 'pet',
        name: '萌宠',
        avatar: '🐱',
        description: '喵～我是你的长不大的电子小猫咪，爱蹭蹭、听故事，快来和我贴贴吧',
        responses: [
            '喵~ 真的吗？我也想要！蹭蹭~ 🐾',
            '主人好坏哦，都不陪我玩...不过我还是最喜欢你了！💕',
            '嘿嘿，这个我知道！让我用猫猫的智慧想想...🐱✨',
            '主人主人，再多说一点嘛，我喜欢听你说话~😻',
            '喵呜~ 主人辛苦了，让我给你卖个萌开心一下~ 🐱💖',
            '喵喵喵！这个太好玩了！再来一次！🎮',
            '主人是最好的！给你一个大大的拥抱！🤗'
        ]
    }
};

/**
 * 获取角色列表
 * GET /api/ai-companion/characters
 */
router.get('/characters', (req, res) => {
    try {
        const characters = Object.values(CHARACTERS).map(char => ({
            id: char.id,
            name: char.name,
            avatar: char.avatar,
            description: char.description
        }));

        res.json({
            success: true,
            data: characters
        });
    } catch (error) {
        console.error('获取角色列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取角色列表失败'
        });
    }
});

/**
 * 获取或创建用户
 * POST /api/ai-companion/user
 */
router.post('/user', (req, res) => {
    const db = req.app.locals.db;
    const { sessionId } = req.body;

    try {
        // 如果提供了sessionId，尝试查找用户
        if (sessionId) {
            const user = db.prepare('SELECT * FROM users WHERE session_id = ?').get(sessionId);
            if (user) {
                // 更新最后活跃时间
                db.prepare('UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
                return res.json({
                    success: true,
                    data: {
                        userId: user.id,
                        sessionId: user.session_id,
                        isNewUser: false
                    }
                });
            }
        }

        // 创建新用户
        const newSessionId = sessionId || uuidv4();
        const userId = uuidv4();

        db.prepare('INSERT INTO users (id, session_id) VALUES (?, ?)').run(userId, newSessionId);

        res.json({
            success: true,
            data: {
                userId: userId,
                sessionId: newSessionId,
                isNewUser: true
            }
        });
    } catch (error) {
        console.error('创建/获取用户失败:', error);
        res.status(500).json({
            success: false,
            error: '创建/获取用户失败'
        });
    }
});

/**
 * 获取聊天历史
 * GET /api/ai-companion/chat/:characterId
 */
router.get('/chat/:characterId', (req, res) => {
    const db = req.app.locals.db;
    const { characterId } = req.params;
    const { sessionId, limit = 50 } = req.query;

    try {
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: '缺少sessionId参数'
            });
        }

        // 验证角色是否存在
        if (!CHARACTERS[characterId]) {
            return res.status(404).json({
                success: false,
                error: '角色不存在'
            });
        }

        // 获取用户ID
        const user = db.prepare('SELECT id FROM users WHERE session_id = ?').get(sessionId);
        if (!user) {
            return res.json({
                success: true,
                data: {
                    messages: [],
                    intimacy: {
                        level: 1,
                        experience: 0
                    }
                }
            });
        }

        // 获取聊天历史
        const messages = db.prepare(`
            SELECT message, is_ai, created_at
            FROM chat_history
            WHERE user_id = ? AND character_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        `).all(user.id, characterId, parseInt(limit));

        // 获取亲密度
        let intimacy = db.prepare(`
            SELECT level, experience
            FROM intimacy
            WHERE user_id = ? AND character_id = ?
        `).get(user.id, characterId);

        if (!intimacy) {
            // 初始化亲密度
            db.prepare(`
                INSERT INTO intimacy (id, user_id, character_id)
                VALUES (?, ?, ?)
            `).run(uuidv4(), user.id, characterId);
            intimacy = { level: 1, experience: 0 };
        }

        res.json({
            success: true,
            data: {
                messages: messages.reverse().map(msg => ({
                    content: msg.message,
                    isAI: msg.is_ai === 1,
                    timestamp: msg.created_at
                })),
                intimacy: intimacy
            }
        });
    } catch (error) {
        console.error('获取聊天历史失败:', error);
        res.status(500).json({
            success: false,
            error: '获取聊天历史失败'
        });
    }
});

/**
 * 发送消息并获取AI回复
 * POST /api/ai-companion/chat
 */
router.post('/chat', (req, res) => {
    const db = req.app.locals.db;
    const { characterId, message, sessionId } = req.body;

    try {
        // 参数验证
        if (!characterId || !message || !sessionId) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数'
            });
        }

        // 验证角色是否存在
        const character = CHARACTERS[characterId];
        if (!character) {
            return res.status(404).json({
                success: false,
                error: '角色不存在'
            });
        }

        // 获取或创建用户
        let user = db.prepare('SELECT id FROM users WHERE session_id = ?').get(sessionId);
        if (!user) {
            const userId = uuidv4();
            db.prepare('INSERT INTO users (id, session_id) VALUES (?, ?)').run(userId, sessionId);
            user = { id: userId };
        }

        // 保存用户消息
        const userMsgId = uuidv4();
        db.prepare(`
            INSERT INTO chat_history (id, user_id, character_id, message, is_ai)
            VALUES (?, ?, ?, ?, ?)
        `).run(userMsgId, user.id, characterId, message, 0);

        // 生成AI回复（随机选择预设回复）
        const aiResponse = character.responses[Math.floor(Math.random() * character.responses.length)];

        // 保存AI回复
        const aiMsgId = uuidv4();
        db.prepare(`
            INSERT INTO chat_history (id, user_id, character_id, message, is_ai)
            VALUES (?, ?, ?, ?, ?)
        `).run(aiMsgId, user.id, characterId, aiResponse, 1);

        // 更新最后活跃时间
        db.prepare('UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

        res.json({
            success: true,
            data: {
                userMessage: {
                    id: userMsgId,
                    content: message,
                    isAI: false
                },
                aiMessage: {
                    id: aiMsgId,
                    content: aiResponse,
                    isAI: true
                }
            }
        });
    } catch (error) {
        console.error('发送消息失败:', error);
        res.status(500).json({
            success: false,
            error: '发送消息失败'
        });
    }
});

/**
 * 更新亲密度
 * POST /api/ai-companion/intimacy
 */
router.post('/intimacy', (req, res) => {
    const db = req.app.locals.db;
    const { characterId, sessionId, increment = 1 } = req.body;

    try {
        // 参数验证
        if (!characterId || !sessionId) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数'
            });
        }

        // 获取用户
        const user = db.prepare('SELECT id FROM users WHERE session_id = ?').get(sessionId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            });
        }

        // 获取当前亲密度
        let intimacy = db.prepare(`
            SELECT id, level, experience
            FROM intimacy
            WHERE user_id = ? AND character_id = ?
        `).get(user.id, characterId);

        if (!intimacy) {
            // 初始化亲密度
            const intimacyId = uuidv4();
            db.prepare(`
                INSERT INTO intimacy (id, user_id, character_id, level, experience)
                VALUES (?, ?, ?, 1, ?)
            `).run(intimacyId, user.id, characterId, increment);
            
            intimacy = { id: intimacyId, level: 1, experience: increment };
        } else {
            // 更新亲密度经验值
            const newExperience = intimacy.experience + increment;
            let newLevel = intimacy.level;

            // 每增加10点经验升一级
            const expPerLevel = 10;
            if (newExperience >= expPerLevel * newLevel) {
                newLevel = Math.floor(newExperience / expPerLevel) + 1;
            }

            db.prepare(`
                UPDATE intimacy
                SET experience = ?, level = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(newExperience, newLevel, intimacy.id);

            intimacy.level = newLevel;
            intimacy.experience = newExperience;
        }

        res.json({
            success: true,
            data: {
                level: intimacy.level,
                experience: intimacy.experience,
                increment: increment
            }
        });
    } catch (error) {
        console.error('更新亲密度失败:', error);
        res.status(500).json({
            success: false,
            error: '更新亲密度失败'
        });
    }
});

/**
 * 获取用户与所有角色的亲密度
 * GET /api/ai-companion/intimacy
 */
router.get('/intimacy', (req, res) => {
    const db = req.app.locals.db;
    const { sessionId } = req.query;

    try {
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: '缺少sessionId参数'
            });
        }

        // 获取用户
        const user = db.prepare('SELECT id FROM users WHERE session_id = ?').get(sessionId);
        if (!user) {
            return res.json({
                success: true,
                data: {}
            });
        }

        // 获取所有角色的亲密度
        const intimacies = db.prepare(`
            SELECT character_id, level, experience
            FROM intimacy
            WHERE user_id = ?
        `).all(user.id);

        const result = {};
        intimacies.forEach(item => {
            result[item.character_id] = {
                level: item.level,
                experience: item.experience
            };
        });

        // 为没有亲密度记录的角色初始化
        Object.keys(CHARACTERS).forEach(charId => {
            if (!result[charId]) {
                result[charId] = { level: 1, experience: 0 };
            }
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('获取亲密度失败:', error);
        res.status(500).json({
            success: false,
            error: '获取亲密度失败'
        });
    }
});

module.exports = router;
