import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import type { PageEntity } from '@/core/domain/type'
import PageBlockComponent from './PageBlockComponent.vue'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBlock: {
      insertPageBlock: (page: PageEntity) => ReturnType
    }
  }
}

export const PageBlock = Node.create({
  name: 'pageBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      pageId: { default: null },
      title: { default: 'Untitled' },
      type: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="page-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'page-block' })]
  },

  addNodeView() {
    return VueNodeViewRenderer(PageBlockComponent)
  },

  addCommands() {
    return {
      insertPageBlock: (page: PageEntity) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            pageId: page.id,
            title: page.title,
            type: page.type,
          },
        })
      },
    }
  },
})