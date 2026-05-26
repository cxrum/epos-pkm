import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockStyle: {
      setBlockColor: (color: string) => ReturnType
      unsetBlockColor: () => ReturnType
      setBlockGap: (v: number) => ReturnType
      unsetBlockGap: () => ReturnType
    }
  }
}

export const BlockStyle = Extension.create({
  name: 'blockStyle',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote'],
        attributes: {
          blockColor: {
            default: null,
            parseHTML: element => element.style.backgroundColor || null,
            renderHTML: attributes => {
              const color = attributes.blockColor || 'var(--bg-block-default)'
              
              return {
                style: `background-color: ${color};`,
                class: 'base-block'
              }
            },
          },
          blockGap: {
            default: null,
            parseHTML: element => element.style.marginTop ? parseInt(element.style.marginTop.replace('px', ''), 10) : null,
            renderHTML: attributes => {
              const gap = attributes.blockGap !== null && attributes.blockGap !== undefined ? attributes.blockGap : 8
              
              return {
                style: `margin-top: ${gap}px;`
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
      setBlockGap: (v: number) => ({ tr, dispatch }) => {
        if (dispatch) {
          const { selection } = tr
          tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (node.isBlock) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                blockGap: v,
              })
            }
          })
        }
        return true
      },
      unsetBlockGap: () => ({ tr, dispatch }) => {
        if (dispatch) {
          const { selection } = tr
          tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (node.isBlock) {
              const attrs = { ...node.attrs }
              delete attrs.blockGap
              tr.setNodeMarkup(pos, undefined, attrs)
            }
          })
        }
        return true
      },
    }
  },
})