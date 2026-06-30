import { Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import CodeBlock from './CodeBlock.vue'

export default Node.create({
  name: 'codeBlock',
  group: 'block',
  atom: true, 

  parseHTML() {
    return [
      {
        tag: 'div[data-type="custom-code-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'custom-code-block', ...HTMLAttributes }]
  },

  addNodeView() {
    return VueNodeViewRenderer(CodeBlock)
  },
})

