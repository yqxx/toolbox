export interface ToolItem {
  id: string
  name: string
  description: string
  icon: 'link' | 'clock' | 'code' | 'hash' | 'json' | 'base64' | 'ico' | 'svg' | 'key' | 'markdown'
  route: string
  category: 'encode' | 'time' | 'format' | 'other'
}

export const tools: ToolItem[] = [
  {
    id: 'url-codec',
    name: 'URL 编解码',
    description: 'Encode / Decode URL 字符串，支持 encodeURIComponent 与 decodeURIComponent',
    icon: 'link',
    route: '/tools/url-codec',
    category: 'encode',
  },
  {
    id: 'timestamp',
    name: '时间戳转换',
    description: 'Unix 时间戳与日期时间互转，支持秒级与毫秒级',
    icon: 'clock',
    route: '/tools/timestamp',
    category: 'time',
  },
  {
    id: 'password-generator',
    name: '随机密码生成',
    description: '生成安全随机密码，可自定义长度、字符类型与生成数量',
    icon: 'key',
    route: '/tools/password-generator',
    category: 'other',
  },
  {
    id: 'ico-generator',
    name: 'ICO 图标生成',
    description: '上传图片生成 favicon.ico，支持透明背景与多尺寸预览',
    icon: 'ico',
    route: '/tools/ico-generator',
    category: 'other',
  },
  {
    id: 'svg-editor',
    name: 'SVG 图标编辑',
    description: '粘贴 SVG 代码，实时调整颜色、尺寸与描边宽度并预览',
    icon: 'svg',
    route: '/tools/svg-editor',
    category: 'format',
  },
  {
    id: 'md-editor',
    name: 'Markdown 排版',
    description: '左侧编辑 Markdown，右侧实时预览排版效果，支持 35 种风格切换',
    icon: 'markdown',
    route: '/tools/md-editor',
    category: 'format',
  },
]
