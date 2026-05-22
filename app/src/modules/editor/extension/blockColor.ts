import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockColor: {
      setBlockColor: (color: string) => ReturnType
      unsetBlockColor: () => ReturnType
    }
  }
}

export const BlockColor = Extension.create({
  name: 'blockColor',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote'],
        attributes: {
          blockColor: {
            default: null,
            parseHTML: element => element.style.backgroundColor || null,
            renderHTML: attributes => {
              const baseStyle = `padding: 0.25rem 0.5rem; border-radius: 0.375rem; margin-left: -0.5rem; margin-right: -0.5rem;`;

              if (!attributes.blockColor){
                return { style: `background-color: var(--bg-block-default); ${baseStyle}`,}
              }
              
              return {
                style: `background-color: ${attributes.blockColor}; ${baseStyle}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setBlockColor: (color: string) => ({ tr, dispatch }) => {
        if (dispatch) {
          const { selection } = tr
          tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (node.isBlock) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                blockColor: color,
              })
            }
          })
        }
        return true
      },
      unsetBlockColor: () => ({ tr, dispatch }) => {
        if (dispatch) {
          const { selection } = tr
          tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (node.isBlock) {
              const attrs = { ...node.attrs }
              delete attrs.blockColor
              tr.setNodeMarkup(pos, undefined, attrs)
            }
          })
        }
        return true
      },
    }
  },
})