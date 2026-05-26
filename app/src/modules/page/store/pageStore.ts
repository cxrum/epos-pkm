import { PageRepository } from '@/modules/page/infra/stubPageRepostory'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PageData } from '../domain/type'

export const usePageStore = defineStore('page', () => {
  const pageData = ref<PageData>()

  const isSaving = ref(false)
  const isLoading = ref(false)

  const updateContent = async (conten: Object) => {
    if (pageData.value !== undefined) {
      pageData.value.content = conten
      await saveToDatabase()
    }
  }

  const saveToDatabase = async () => {
    isSaving.value = true
    if (pageData.value !== undefined) {
      await PageRepository.save(pageData.value)
    }
    isSaving.value = false
  }

  const getFromDatabase = async (pageId: number) => {
    isLoading.value = true
    const result = await PageRepository.get(pageId)
    if (result) {
      pageData.value = result
    }
    isLoading.value = false    
  }


  return { 
    isSaving, 
    isLoading,
    pageData,
    updateContent,
    getFromDatabase
  }
})