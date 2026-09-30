/**
 * 现代极简“射覆”游戏 - 后台梅花易数平实转化引擎
 * 该算法不包含任何传统玄学术语，直接将时空与种子转化为平实的物理、材质和功能属性线索。
 */

// 1. 基础八卦属性映射表（平实化、跨文化）
const MODERN_BAGUA_TRAITS = {
  1: { // 乾 (Heaven/Metal)
    material: "metallic or rigid synthesis",
    texture: "smooth, solid, and durable",
    form: "structured or circular",
    context: "often carried for utility or precision"
  },
  2: { // 兑 (Marsh/Open)
    material: "plastic, soft metal, or refined composite",
    texture: "lightweight with polished edges",
    form: "compact and portable",
    context: "associated with personal daily interaction"
  },
  3: { // 离 (Fire/Light)
    material: "glass, electronic components, or glossy finish",
    texture: "sleek, reflective, or capable of emitting light/heat",
    form: "flat or electronic device format",
    context: "related to energy, optics, or modern tech"
  },
  4: { // 震 (Thunder/Movement)
    material: "wood, complex plastics, or mechanical parts",
    texture: "textured, dynamic, or structural",
    form: "elongated or mechanical shape",
    context: "related to motion, sound, or physical function"
  },
  5: { // 巽 (Wind/Flexible)
    material: "paper, fabric, organic material, or thin sheets",
    texture: "flexible, light, or fibrous",
    form: "flat, folded, or linear",
    context: "often used for reading, writing, or covering"
  },
  6: { // 坎 (Water/Fluid)
    material: "liquid container, dark-colored material, or flexible plastic",
    texture: "smooth, cool to the touch, or moisture-resistant",
    form: "hollow, sealed, or fluid-holding",
    context: "associated with storage, hydration, or containment"
  },
  7: { // 艮 (Mountain/Solid)
    material: "stone, thick plastic, dense ceramic, or heavy composite",
    texture: "firm, matte, or sturdy",
    form: "blocky, stable, or small steady object",
    context: "designed to stay stationary or protect contents"
  },
  8: { // 坤 (Earth/Container)
    material: "cloth, leather, soft rubber, or natural fabric",
    texture: "soft, flexible, or cloth-like",
    form: "malleable, pouch-like, or open-ended",
    context: "used for holding, carrying, or wrapping other items"
  }
};

/**
 * 根据时间戳和随机因子生成平实线索
 * @param {string} puzzleId - 谜题的唯一标识
 * @param {string} playerSessionKey - 玩家的会话特征（用于让不同人点出不同的线索）
 * @returns {object} - 包含平实描述的对象
 */
function generateModernClue(puzzleId, playerSessionKey = "") {
  // 结合当前时间戳、谜题ID和玩家标识生成伪随机伪梅花数
  const now = Date.now();
  
  // 简单哈希计算模拟梅花易数的上下卦与变爻
  let hash = 0;
  const str = puzzleId + now.toString() + playerSessionKey;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  
  const positiveHash = Math.abs(hash);
  
  // 计算主卦 (1-8) 和 伴随属性 (1-8)
  const primaryIndex = (positiveHash % 8) + 1;
  const secondaryIndex = (Math.floor(positiveHash / 8) % 8) + 1;
  
  const trait1 = MODERN_BAGUA_TRAITS[primaryIndex];
  const trait2 = MODERN_BAGUA_TRAITS[secondaryIndex];

  // 组合成平实、现代、无玄学术语的线索描述（英文版，可轻松翻译多语言）
  const clueText = `The current inquiry signature suggests an object primarily made of ${trait1.material}, featuring a ${trait2.texture} texture. Its form is generally ${trait1.form}, and it is typically ${trait2.context}.`;

  return {
    success: true,
    timestamp: now,
    clue: clueText,
    metadata: {
      inferredMaterial: trait1.material,
      inferredTexture: trait2.texture
    }
  };
}

// 导出模块（如果在 Node.js 环境下）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateModernClue };
}