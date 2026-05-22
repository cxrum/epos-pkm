import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    commandParser: {
      parseCommand: (command: string) => ReturnType
    }
  }
}


export const BlockColor = Extension.create({
  name: 'commandParser',
  
})